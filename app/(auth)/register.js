import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Colors } from "../../constants/colors";
import { createClientProfile } from "../../services/database";

export default function Register() {
  const db = useSQLiteContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const returnToSignIn = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/signin");
    }
  };

  const createAccount = async () => {
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter your full name and a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the terms to continue.");
      return;
    }

    setIsCreating(true);
    setError("");
    try {
      await createClientProfile(db, { name, email });
      router.replace("/(client)");
    } catch (createError) {
      setError(createError?.message || "The demo client account could not be created.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>GET STARTED</Text>

        <Text style={styles.title}>Create your account</Text>

        <Text style={styles.description}>
          Create a local demo profile that is shared with the RentTrack admin records.
        </Text>

        <Text style={styles.inputLabel}>FULL NAME</Text>
        <TextInput
          placeholder="Juan Dela Cruz"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
        <TextInput
          placeholder="you@company.com"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>PASSWORD</Text>
        <TextInput
          placeholder="At least 6 characters"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAgreed((prev) => !prev)}
        >
          <View
            style={[styles.checkbox, agreed && styles.checkboxChecked]}
          />
          <Text style={styles.terms}>
            I agree to the{" "}
            <Text style={styles.link}>Terms of Service</Text>
            {" "}and{" "}
            <Text style={styles.link}>Privacy Policy.</Text>
          </Text>
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isCreating && styles.buttonDisabled]}
          onPress={createAccount}
          disabled={isCreating}
        >
          <Text style={styles.buttonText}>{isCreating ? "Creating profile…" : "Create account"}</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.bottomText}>
          Already have an account?{" "}
          <Text
            style={styles.link}
            onPress={returnToSignIn}
          >
            Sign In
          </Text>
        </Text>
      </View>

      <Text style={styles.footer}>
        RentTrack Fleet Management · v1.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },

  form: {
    marginTop: 155,
  },

  label: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  title: {
    color: Colors.white,
    fontSize: 29,
    marginTop: 6,
  },

  description: {
    color: Colors.muted,
    marginTop: 8,
    marginBottom: 22,
  },

  inputLabel: {
    color: "#B8C9C1",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 13,
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

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
  },

  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 3,
    backgroundColor: Colors.surface,
    marginRight: 8,
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  terms: {
    color: Colors.muted,
    fontSize: 10,
    flex: 1,
    flexWrap: "wrap",
  },

  link: {
    color: Colors.primary,
    fontWeight: "700",
  },

  button: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.65 },
  error: { color: Colors.danger, fontSize: 10, lineHeight: 15, marginTop: 12 },

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
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    color: "#345047",
    fontSize: 9,
  },
});