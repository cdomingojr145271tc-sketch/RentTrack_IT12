import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Colors } from "../../constants/colors";

export default function SignIn() {
  const [role, setRole] = useState("client");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");

  const continueToApp = () => {
    if (role === "admin") {
      router.replace("/(tabs)");
      return;
    }
    router.replace("/(client)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={require("../../assets/RTlogo.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="RT logo"
          />
        </View>

        <View style={styles.form}>
        <Text style={styles.label}>WELCOME TO RENTTRACK</Text>

        <Text style={styles.title}>Your next ride starts here.</Text>

        <Text style={styles.description}>
          Sign in to book a vehicle or manage your rental fleet.
        </Text>

        <View style={styles.roleSwitch}>
          {[
            { id: "client", title: "Client", caption: "Book a ride" },
            { id: "admin", title: "Administrator", caption: "Manage fleet" },
          ].map((item) => {
            const selected = role === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={[styles.roleOption, selected && styles.roleOptionActive]}
                onPress={() => setRole(item.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.roleTitle, selected && styles.roleTitleActive]}>
                  {item.title}
                </Text>
                <Text style={styles.roleCaption}>{item.caption}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
        <TextInput
          placeholder="mia@renttrack.demo"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.inputLabel}>PASSWORD</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor={Colors.muted}
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            autoComplete="password"
          />

          <TouchableOpacity
            style={styles.showButton}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Text style={styles.link}>
              {showPassword ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe((prev) => !prev)}
          >
            <View
              style={[
                styles.checkbox,
                rememberMe && styles.checkboxChecked,
              ]}
            />
            <Text style={styles.remember}>Remember me</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {role === "client" ? (
          <Text style={styles.demoHint}>
            Prototype access · email and password are optional
          </Text>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={continueToApp}>
          <Text style={styles.buttonText}>
            Continue as {role === "admin" ? "administrator" : "client"}
          </Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.bottomText}>
          New to RentTrack?{" "}
          <Text
            style={styles.link}
            onPress={() => router.push("/register")}
          >
            Create client profile
          </Text>
        </Text>
        </View>

        <Text style={styles.footer}>
          RENTTRACK · YOUR JOURNEY, TRACKED
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },

  hero: {
    alignItems: "center",
    marginTop: 18,
  },

  logo: {
    width: 92,
    height: 92,
  },

  form: {
    marginTop: 20,
  },

  label: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  title: {
    color: Colors.white,
    fontSize: 27,
    fontWeight: "800",
    marginTop: 8,
  },

  description: {
    color: Colors.muted,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },

  roleSwitch: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 7,
  },

  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  roleOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: "#142719",
  },

  roleTitle: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 13,
  },

  roleTitleActive: {
    color: Colors.primary,
  },

  roleCaption: {
    color: Colors.muted,
    fontSize: 10,
    marginTop: 4,
  },

  inputLabel: {
    color: "#B8C9C1",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 15,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 14,
    color: Colors.white,
    backgroundColor: Colors.surface,
  },

  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },

  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingRight: 55,
    color: Colors.white,
    backgroundColor: Colors.surface,
  },

  showButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 3,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },

  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  remember: {
    color: Colors.muted,
    fontSize: 11,
  },

  link: {
    color: Colors.primary,
    fontWeight: "700",
  },

  button: {
    minHeight: 52,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 22,
  },

  buttonText: {
    color: Colors.background,
    fontWeight: "800",
    textAlign: "center",
  },

  buttonArrow: {
    color: Colors.background,
    fontWeight: "800",
    textAlign: "center",
  },

  demoHint: {
    color: Colors.muted,
    textAlign: "center",
    fontSize: 10,
    marginTop: 10,
  },
  signInError: { color: Colors.danger, fontSize: 10, lineHeight: 15, marginTop: 10 },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 24,
  },

  bottomText: {
    color: Colors.muted,
    textAlign: "center",
    fontSize: 11,
  },

  footer: {
    alignSelf: "center",
    color: "#345047",
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 24,
  },
});