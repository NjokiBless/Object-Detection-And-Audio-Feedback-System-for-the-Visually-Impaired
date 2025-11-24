import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import * as TaskManager from "expo-task-manager";
import { DeviceEventEmitter, Platform } from "react-native";

// --- 1. Background Task Definition (Must be Global) ---
const LOCATION_TASK_NAME = "background-location-task";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Background location task error:", error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    if (locations && locations.length > 0) {
      // Send the update to the React Component via Event Emitter
      DeviceEventEmitter.emit("backgroundLocationUpdate", locations[0]);
    }
  }
});

type NavigationContextType = {
  isNavigating: boolean;
  currentLocation: Location.LocationObject | null;
  startNavigation: (destName: string, steps: string[]) => void;
  stopNavigation: () => void;
  lastInstruction: string;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  
  // Navigation State
  const [routeSteps, setRouteSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [lastInstruction, setLastInstruction] = useState("");

  // --- 2. Initial Location Logic (Fixes Hanging) ---
  useEffect(() => {
    let mounted = true;

    const initLocation = async () => {
      try {
        // A. Request Permissions
        const { status: fg } = await Location.requestForegroundPermissionsAsync();
        if (fg !== "granted") {
          console.log("Foreground permission denied");
          return;
        }

        const { status: bg } = await Location.requestBackgroundPermissionsAsync();
        if (bg !== "granted") {
          console.log("Background permission denied (voice may stop in bg)");
        }

        // B. FAST FALLBACK: Get cached location immediately
        // This prevents the "Locating GPS..." infinite spinner
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (mounted && lastKnown) {
            console.log("Using last known location (Fast)");
            setCurrentLocation(lastKnown);
        }

        // C. Get Fresh Location (Balanced Accuracy)
        // High accuracy often times out indoors. Balanced is fast and good enough for initial map load.
        const freshLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, 
        });

        if (mounted) {
            console.log("Acquired fresh location");
            setCurrentLocation(freshLoc);
        }

      } catch (e) {
        console.log("Error initializing location:", e);
      }
    };

    initLocation();

    // D. Listen for updates from the background task
    const subscription = DeviceEventEmitter.addListener("backgroundLocationUpdate", (newLoc) => {
      if(mounted) setCurrentLocation(newLoc);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  // --- 3. Voice Logic ---
  const speak = (text: string) => {
    const cleanText = text.replace(/<[^>]*>?/gm, ''); // Remove HTML
    setLastInstruction(cleanText);
    
    // Stop previous to avoid overlap
    Speech.stop();
    Speech.speak(cleanText, { 
        language: "en", 
        pitch: 1.0, 
        rate: 0.9,
    });
  };

  // --- 4. Start Navigation (Background Mode) ---
  const startNavigation = async (destName: string, steps: string[]) => {
    setRouteSteps(steps);
    setCurrentStepIndex(0);
    setIsNavigating(true);

    speak(`Starting navigation to ${destName}.`);

    try {
      // Clean up previous tasks
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      // Start Background Updates
      // This supports 'foregroundService' which keeps the app alive
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,      // 2 seconds
        distanceInterval: 5,     // 5 meters
        showsBackgroundLocationIndicator: true, // iOS Blue Bar
        foregroundService: {     // Android Notification
          notificationTitle: "Bloculis Navigation",
          notificationBody: `Guiding you to ${destName}`,
          notificationColor: "#3b82f6",
          killServiceOnDestroy: false,
        },
      });
    } catch (e) {
      console.error("Error starting nav:", e);
    }
  };

  // --- 5. Step Simulator (Timer Loop) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isNavigating && routeSteps.length > 0) {
      interval = setInterval(() => {
        setCurrentStepIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;

          if (nextIndex >= routeSteps.length) {
            speak("You have arrived at your destination.");
            stopNavigation();
            return prevIndex;
          }

          const instruction = routeSteps[nextIndex];
          speak(instruction);
          return nextIndex;
        });
      }, 15000); // Read next instruction every 15 seconds
    }

    return () => clearInterval(interval);
  }, [isNavigating, routeSteps]);

  // --- 6. Stop Navigation ---
  const stopNavigation = async () => {
    setIsNavigating(false);
    setRouteSteps([]);
    setLastInstruction("");
    Speech.stop();
    speak("Navigation ended.");
    
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
    } catch (e) {
      console.log("Error stopping nav:", e);
    }
  };

  return (
    <NavigationContext.Provider
      value={{
        isNavigating,
        currentLocation,
        startNavigation,
        stopNavigation,
        lastInstruction
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within NavigationProvider");
  return context;
};