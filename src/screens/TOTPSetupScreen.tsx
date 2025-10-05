import React, { useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { authApi } from "../api/client";

export default function TOTPSetupScreen({ route, navigation }: any){
  const [email, setEmail] = useState(route?.params?.email || "");
  const [qr, setQr] = useState<string|undefined>();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const startSetup = async ()=>{
    setBusy(true); setMsg("");
    try{
      const { data } = await authApi.post("/auth/totp/setup", { email });
      if (data?.ok) setQr(data.qr_data_url);
    }catch(e:any){ setMsg(e?.response?.data?.error || "Setup failed"); }
    finally{ setBusy(false); }
  };

  const verify = async ()=>{
    setBusy(true); setMsg("");
    try{
      const { data } = await authApi.post("/auth/totp/verify", { email, token });
      if (data?.ok) { setMsg("TOTP enabled!"); navigation.goBack(); }
      else setMsg("Invalid code");
    }catch(e:any){ setMsg(e?.response?.data?.error || "Verify failed"); }
    finally{ setBusy(false); }
  };

  return (
    <View style={styles.wrap}>
      <Text variant="headlineSmall" style={{color:"#fff", marginBottom:8}}>Microsoft Authenticator</Text>
      <TextInput mode="outlined" label="Email" value={email} onChangeText={setEmail}
        style={styles.in} keyboardType="email-address" autoCapitalize="none" />
      <Button mode="contained" onPress={startSetup} loading={busy} style={styles.btn}>Generate QR</Button>

      {qr && (
        <>
          <Image source={{ uri: qr }} style={{ width: 220, height: 220, margin: 16 }} />
          <TextInput mode="outlined" label="6-digit from Authenticator" value={token}
            onChangeText={setToken} style={styles.in} keyboardType="number-pad" />
          <Button mode="contained" onPress={verify} loading={busy} style={styles.btn}>Verify TOTP</Button>
        </>
      )}

      {!!msg && <Text style={{color:"#cbd5e1", marginTop:8}}>{msg}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flex:1, alignItems:"center", paddingTop:32, backgroundColor:"#0b1220" },
  in: { width:"90%", marginBottom:12, backgroundColor:"#fff" },
  btn: { width:"90%", marginTop:4 }
});
