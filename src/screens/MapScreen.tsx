// vi-app/src/screens/MapScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Keyboard, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Platform 
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  TextInput, 
  Button, 
  Text, 
  IconButton, 
  Surface, 
  ActivityIndicator, 
  Divider 
} from "react-native-paper";
import { useNavigation } from "../context/NavigationContext";

const { width } = Dimensions.get("window");

const GOOGLE_API_KEY = "AIzaSyA34eTCthhtiwaw8VVvjh1ME_O7emtc1LY";

type PlacePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  }
};

export default function MapScreen({ navigation }: any) {
  // Get Global Navigation State
  const { 
    isNavigating, 
    startNavigation, 
    stopNavigation, 
    currentLocation, 
    lastInstruction 
  } = useNavigation();
  
  const mapRef = useRef<MapView>(null);
  
  // --- State ---
  const [originText, setOriginText] = useState("Current Location");
  const [destText, setDestText] = useState("");
  
  // Coordinates
  const [originCoords, setOriginCoords] = useState<any>(null);
  const [destCoords, setDestCoords] = useState<any>(null);
  
  // Suggestions
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Route Info
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(false);

  // 1. Set Origin to Current Location on Load
  useEffect(() => {
    if (currentLocation && !originCoords) {
      setOriginCoords({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }
  }, [currentLocation]);

  // 2. Google Places Autocomplete
  const fetchSuggestions = async (text: string) => {
    setDestText(text);
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Filter by country:ke (Kenya) to improve relevance
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_API_KEY}&components=country:ke&language=en`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.status === "OK") {
        setSuggestions(json.predictions);
        setShowSuggestions(true);
      }
    } catch (e) {
      console.error("Autocomplete error:", e);
    }
  };

  // 3. Handle Selection from List
  const handlePlaceSelect = async (placeId: string, description: string) => {
    setDestText(description);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
    setLoading(true);

    try {
        // Fetch Details (Lat/Lng)
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_API_KEY}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.status === "OK" && json.result.geometry) {
            const location = json.result.geometry.location;
            const newDest = { latitude: location.lat, longitude: location.lng };
            setDestCoords(newDest);
            fitMap(newDest);
        } else {
            Alert.alert("Error", "Could not fetch location details.");
        }
    } catch(e) {
        Alert.alert("Error", "Network error.");
    } finally {
        setLoading(false);
    }
  };

  const fitMap = (targetDest: any) => {
    if (originCoords && mapRef.current) {
        mapRef.current.fitToCoordinates([originCoords, targetDest], {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true,
        });
    }
  };

  // 4. Start Voice
  const handleStartVoice = () => {
    if (!destCoords) {
        Alert.alert("Destination Required", "Please select a destination first.");
        return;
    }
    if (steps.length === 0) {
        Alert.alert("Loading Route", "Please wait for the route to appear.");
        return;
    }
    // Start background voice
    startNavigation(destText, steps);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* --- Top Floating Panel (Header + Inputs) --- */}
      <Surface style={styles.topPanel} elevation={4}>
        
        {/* Header: Back Button + Title */}
        <View style={styles.headerRow}>
            <IconButton 
                icon="arrow-left" 
                size={24} 
                iconColor="#1e293b"
                onPress={() => navigation.navigate("Dashboard")} 
            />
            <Text variant="titleMedium" style={styles.headerTitle}>Navigation</Text>
        </View>

        {/* Input: Origin */}
        <View style={styles.inputRow}>
            <IconButton icon="map-marker" size={20} iconColor="#ef4444" style={styles.inputIcon} />
            <TextInput 
                mode="outlined"
                style={styles.input}
                value={originText}
                onChangeText={setOriginText}
                label="From"
                dense
                outlineColor="#cbd5e1"
                theme={{ roundness: 8 }}
            />
        </View>

        {/* Input: Destination */}
        <View style={[styles.inputRow, { marginTop: 8 }]}>
            <IconButton icon="flag-checkered" size={20} iconColor="#22c55e" style={styles.inputIcon} />
            <TextInput 
                mode="outlined"
                style={styles.input}
                value={destText}
                onChangeText={fetchSuggestions}
                label="To"
                placeholder="Search destination..."
                dense
                outlineColor="#cbd5e1"
                theme={{ roundness: 8 }}
            />
        </View>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.place_id}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={styles.suggestionItem} 
                            onPress={() => handlePlaceSelect(item.place_id, item.description)}
                        >
                            <View style={{flex: 1}}>
                                <Text style={styles.mainText} numberOfLines={1}>
                                    {item.structured_formatting?.main_text || item.description}
                                </Text>
                                <Text style={styles.subText} numberOfLines={1}>
                                    {item.structured_formatting?.secondary_text}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <Divider />}
                />
            </View>
        )}
      </Surface>

      {/* --- Map Area --- */}
      <View style={styles.mapContainer}>
        {loading && (
            <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
        )}
        
        {originCoords ? (
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: originCoords.latitude,
                    longitude: originCoords.longitude,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.015,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
                userInterfaceStyle="light"
            >
                {/* Origin Marker */}
                <Marker coordinate={originCoords} title="Start" />

                {/* Destination Marker */}
                {destCoords && (
                    <Marker coordinate={destCoords} title="Destination" pinColor="green" />
                )}

                {/* Route Line (Directions) */}
                {originCoords && destCoords && (
                    <MapViewDirections
                        origin={originCoords}
                        destination={destCoords}
                        apikey={GOOGLE_API_KEY}
                        strokeWidth={5}
                        strokeColor="#3b82f6"
                        onReady={(result) => {
                            setDistance(`${result.distance.toFixed(1)} km`);
                            setDuration(`${Math.round(result.duration)} min`);
                            
                            // Extract plain text instructions
                            // @ts-ignore
                            const legSteps = result.legs?.[0]?.steps?.map((s:any) => 
                                s.html_instructions.replace(/<[^>]*>?/gm, '')
                            ) || ["Proceed to destination"];
                            
                            setSteps(legSteps);
                        }}
                        onError={(errorMessage) => {
                            console.log("Directions Error:", errorMessage);
                        }}
                    />
                )}
            </MapView>
        ) : (
            <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{ color: 'white', marginTop: 10 }}>Locating GPS...</Text>
            </View>
        )}

        {/* --- Footer Controls (Only visible if destination set) --- */}
        {destCoords && (
            <Surface style={styles.footer} elevation={5}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#0f172a' }}>
                        {duration} <Text style={{ color: '#64748b', fontSize: 14 }}>({distance})</Text>
                    </Text>
                    <Text style={{ color: '#059669', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                        {isNavigating ? `🔊 ${lastInstruction}` : "Ready to start navigation"}
                    </Text>
                </View>
                
                <Button 
                    mode="contained" 
                    buttonColor={isNavigating ? "#ef4444" : "#3b82f6"} 
                    onPress={isNavigating ? stopNavigation : handleStartVoice}
                    icon={isNavigating ? "stop" : "navigation"}
                    contentStyle={{ height: 48 }}
                >
                    {isNavigating ? "Stop" : "Start"}
                </Button>
            </Surface>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220" },
  
  // Top Panel
  topPanel: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 20, // Ensures suggestions float over map
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: -12 },
  headerTitle: { fontWeight: 'bold', color: '#0f172a', marginLeft: 0 },
  
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputIcon: { margin: 0, marginRight: 4 },
  input: { flex: 1, height: 40, fontSize: 14, backgroundColor: '#fff' },
  
  // Autocomplete Suggestions
  suggestionsBox: {
    position: 'absolute',
    top: 135, // Adjust based on header height
    left: 56, // Align with text input
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: 220,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 30,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  mainText: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  subText: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // Map
  mapContainer: { flex: 1, zIndex: 1 },
  map: { width: width, height: '100%' },
  loader: { position: 'absolute', top: 20, alignSelf: 'center', zIndex: 10 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  }
});