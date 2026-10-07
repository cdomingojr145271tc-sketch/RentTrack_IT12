import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/colors";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = useState("");
  const [facing, setFacing] = useState("back");

  const onBarcodeScanned = ({ data }) => {
    if (!scanResult) setScanResult(data);
  };

  if (!permission) {
    return <View style={styles.loading}><Text style={styles.loadingText}>Preparing camera…</Text></View>;
  }

  const hasPermission = permission.granted;
  const cameraUnavailable = Platform.OS === "web" && typeof navigator !== "undefined" && !navigator.mediaDevices;

  return (
    <View style={styles.screen}>
      {hasPermission && !scanResult && !cameraUnavailable ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={onBarcodeScanned}
        />
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="scan-outline" size={78} color="#44634D" />
        </View>
      )}
      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={21} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.eyebrow}>RENTTRACK PICKUP</Text>
            <Text style={styles.title}>Scan QR code</Text>
          </View>
          {hasPermission && !scanResult ? (
            <TouchableOpacity style={styles.iconButton} onPress={() => setFacing((current) => current === "back" ? "front" : "back")}>
              <Ionicons name="camera-reverse-outline" size={21} color={Colors.white} />
            </TouchableOpacity>
          ) : <View style={styles.iconButton} />}
        </View>

        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          {!scanResult && hasPermission && <View style={styles.scanLine} />}
          {scanResult ? (
            <View style={styles.resultBadge}>
              <Ionicons name="checkmark-circle" size={33} color={Colors.primary} />
              <Text style={styles.resultTitle}>Code scanned</Text>
              <Text style={styles.resultValue} numberOfLines={2}>{scanResult}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomPanel}>
          {scanResult ? (
            <>
              <Text style={styles.bottomTitle}>You’re all set</Text>
              <Text style={styles.bottomCopy}>Your rental QR was read successfully. Show this screen to the rental associate.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setScanResult("")}>
                <Text style={styles.primaryButtonText}>Scan another code</Text>
              </TouchableOpacity>
            </>
          ) : !hasPermission ? (
            <>
              <Text style={styles.bottomTitle}>Camera access needed</Text>
              <Text style={styles.bottomCopy}>Allow camera access to scan the QR code on your rental confirmation.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                <Text style={styles.primaryButtonText}>Allow camera access</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setScanResult("RENTTRACK-DEMO-4821")}>
                <Text style={styles.demoLink}>Try a prototype scan</Text>
              </TouchableOpacity>
            </>
          ) : cameraUnavailable ? (
            <>
              <Text style={styles.bottomTitle}>Camera unavailable</Text>
              <Text style={styles.bottomCopy}>Open this prototype on a device with a camera, or preview the successful scan state.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setScanResult("RENTTRACK-DEMO-4821")}>
                <Text style={styles.primaryButtonText}>Preview a QR scan</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.bottomTitle}>Point your camera at the QR</Text>
              <Text style={styles.bottomCopy}>Keep the code inside the frame. It will be scanned automatically.</Text>
              <TouchableOpacity style={styles.demoButton} onPress={() => setScanResult("RENTTRACK-DEMO-4821")}>
                <Ionicons name="qr-code-outline" size={16} color={Colors.primary} />
                <Text style={styles.demoButtonText}>Preview a prototype scan</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#06100B" },
  loading: { flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  loadingText: { color: Colors.white, fontSize: 12 },
  cameraPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0B1910", alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, justifyContent: "space-between", paddingHorizontal: 19 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 6 },
  iconButton: { width: 41, height: 41, borderRadius: 13, backgroundColor: "#07130FE8", borderWidth: 1, borderColor: "#FFFFFF25", alignItems: "center", justifyContent: "center" },
  headerTitle: { alignItems: "center" },
  eyebrow: { color: Colors.primary, fontSize: 7, fontWeight: "800", letterSpacing: 1 },
  title: { color: Colors.white, fontSize: 16, fontWeight: "800", marginTop: 4 },
  scannerFrame: { width: 250, height: 250, alignSelf: "center", alignItems: "center", justifyContent: "center" },
  corner: { position: "absolute", width: 34, height: 34, borderColor: Colors.primary },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  scanLine: { width: 210, height: 2, backgroundColor: Colors.primary, opacity: 0.85 },
  resultBadge: { width: 218, alignItems: "center", backgroundColor: "#07130FEE", padding: 18, borderRadius: 14 },
  resultTitle: { color: Colors.white, fontSize: 13, fontWeight: "800", marginTop: 8 },
  resultValue: { color: Colors.primary, fontSize: 10, textAlign: "center", marginTop: 7 },
  bottomPanel: { backgroundColor: "#07130FF0", borderWidth: 1, borderColor: "#FFFFFF1C", borderRadius: 16, padding: 17, marginBottom: 8 },
  bottomTitle: { color: Colors.white, fontSize: 15, fontWeight: "800", textAlign: "center" },
  bottomCopy: { color: "#A3B0A8", fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 7, marginBottom: 15 },
  primaryButton: { height: 45, backgroundColor: Colors.primary, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: Colors.background, fontSize: 11, fontWeight: "800" },
  demoLink: { color: Colors.primary, textAlign: "center", fontSize: 10, fontWeight: "700", marginTop: 13 },
  demoButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 41, borderWidth: 1, borderColor: Colors.border, borderRadius: 9 },
  demoButtonText: { color: Colors.primary, fontSize: 10, fontWeight: "700" },
});
