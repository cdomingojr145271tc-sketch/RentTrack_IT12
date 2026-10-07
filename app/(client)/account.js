import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";
import { Colors } from "../../constants/colors";
import { getCurrentClient } from "../../services/database";

const OPTIONS = [
  ["person-outline", "Personal information", "View the customer record shared with admin"],
  ["card-outline", "Checkout methods", "Demo GCash, card, or cash options"],
  ["help-circle-outline", "Help & support", "We are here to help"],
  ["document-text-outline", "Terms & privacy", "Your information matters"],
];

export default function ClientAccount() {
  const db = useSQLiteContext();
  const [client, setClient] = useState(null);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let isActive = true;
    const loadProfile = async () => {
      try {
        const profile = await getCurrentClient(db);
        if (!profile) throw new Error("The active client profile could not be found.");
        if (isActive) {
          setClient(profile);
          setProfileError("");
        }
      } catch (error) {
        if (isActive) setProfileError(error?.message || "Client profile could not be loaded.");
      }
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "customers" || event.tableName === "client_session") {
        void loadProfile();
      }
    });
    void loadProfile();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db]);

  const name = client?.name || "Loading profile…";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const memberSince = client?.createdAt
    ? new Date(client.createdAt.replace(" ", "T") + (client.createdAt.includes("Z") ? "" : "Z"))
      .toLocaleDateString("en-PH", { month: "long", year: "numeric" })
    : "Demo account";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR RENTTRACK PROFILE</Text>
        <Text style={styles.title}>Account</Text>
        <View style={styles.profile}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials || "RT"}</Text></View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{client?.email || client?.phone || "Local prototype profile"}</Text>
          </View>
          <Ionicons name="sync-outline" size={19} color={Colors.primary} />
        </View>
        {profileError ? <Text style={styles.profileError}>{profileError}</Text> : null}
        <View style={styles.memberCard}>
          <View style={styles.memberIcon}><Ionicons name="ribbon-outline" size={21} color={Colors.primary} /></View>
          <View style={styles.memberCopy}><Text style={styles.memberLabel}>RENTTRACK MEMBER</Text><Text style={styles.memberTitle}>Customer since {memberSince}</Text></View>
          <Ionicons name="chevron-forward" size={17} color={Colors.muted} />
        </View>
        <Text style={styles.sectionTitle}>SETTINGS & SUPPORT</Text>
        <View style={styles.options}>
          {OPTIONS.map(([icon, title, subtitle]) => (
            <TouchableOpacity
              key={title}
              style={styles.option}
              onPress={() => {
                if (title === "Personal information") {
                  Alert.alert(
                    "Shared customer record",
                    `${client?.name || "Client"}\n${client?.email || "No email recorded"}\n${client?.phone || "No phone recorded"}`
                  );
                } else if (title === "Checkout methods") {
                  Alert.alert(
                    "Demo checkout methods",
                    "GCash, card, and cash can be selected during checkout. No card details are stored."
                  );
                } else {
                  Alert.alert(title, "This section is part of the RentTrack prototype.");
                }
              }}
            >
              <View style={styles.optionIcon}><Ionicons name={icon} size={19} color={Colors.primary} /></View>
              <View style={styles.optionCopy}><Text style={styles.optionTitle}>{title}</Text><Text style={styles.optionSubtitle}>{subtitle}</Text></View>
              <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.signOut} onPress={() => router.replace("/signin")}>
          <Ionicons name="log-out-outline" size={17} color={Colors.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
        <Text style={styles.version}>RENTTRACK CLIENT · PROTOTYPE 1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 19, paddingTop: 25, paddingBottom: 30 },
  eyebrow: { color: Colors.primary, fontSize: 8, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: Colors.white, fontSize: 26, fontWeight: "900", marginTop: 7, marginBottom: 20 },
  profile: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 13, padding: 15 },
  avatar: { width: 48, height: 48, borderRadius: 25, backgroundColor: "#263D27", alignItems: "center", justifyContent: "center" },
  avatarText: { color: Colors.primary, fontWeight: "900", fontSize: 15 },
  profileText: { flex: 1, marginLeft: 12 },
  name: { color: Colors.white, fontWeight: "800", fontSize: 13 },
  email: { color: Colors.muted, fontSize: 9, marginTop: 5 },
  profileError: { color: Colors.danger, fontSize: 9, marginTop: 8 },
  memberCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#14281C", padding: 14, borderRadius: 12, marginTop: 12, marginBottom: 26 },
  memberIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#1C3221", alignItems: "center", justifyContent: "center" },
  memberCopy: { flex: 1, marginLeft: 11 },
  memberLabel: { color: Colors.primary, fontSize: 7, fontWeight: "800", letterSpacing: 0.8 },
  memberTitle: { color: Colors.white, fontWeight: "700", fontSize: 10, marginTop: 4 },
  sectionTitle: { color: "#D7E4DB", fontSize: 8, fontWeight: "800", letterSpacing: 1, marginBottom: 10 },
  options: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12 },
  option: { minHeight: 63, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#1A3025" },
  optionIcon: { width: 35, height: 35, alignItems: "center", justifyContent: "center" },
  optionCopy: { flex: 1, marginLeft: 8 },
  optionTitle: { color: Colors.white, fontSize: 10, fontWeight: "700" },
  optionSubtitle: { color: Colors.muted, fontSize: 8, marginTop: 4 },
  signOut: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 18 },
  signOutText: { color: Colors.danger, fontSize: 10, fontWeight: "700" },
  version: { color: "#43564C", textAlign: "center", fontSize: 8, letterSpacing: 0.7, marginTop: 3 },
});
