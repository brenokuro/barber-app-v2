import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email] = useState(user?.email || ""); // Email não pode ser editado
  const [showPass, setShowPass] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone?: string }) => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar perfil");
      return response.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setSuccess("Perfil atualizado com sucesso!");
      setError("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: any) => {
      setError(e.message || "Erro ao atualizar perfil");
      setSuccess("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao alterar senha");
      return response.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setSuccess("Senha alterada com sucesso!");
      setError("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: any) => {
      setError(e.message || "Erro ao alterar senha");
      setSuccess("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    
    setError("");
    setLoading(true);
    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError("Senha atual e nova senha são obrigatórias");
      return;
    }
    if (newPassword.length < 6) {
      setError("Nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    setError("");
    setLoading(true);
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Editar Perfil</Text>
          <Text style={styles.desc}>Atualize suas informações</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <View style={styles.inputContainer}>
                <Feather name="user" size={18} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, { opacity: 0.6 }]}>
                <Feather name="mail" size={18} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  editable={false}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <Text style={styles.helperText}>Email não pode ser alterado</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={18} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.black} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Salvar Perfil</Text>
              )}
            </Pressable>
          </View>

          <View style={[styles.section, styles.sectionBorder]}>
            <Text style={styles.sectionTitle}>Alterar Senha</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha Atual</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={18} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Digite sua senha atual"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={18} color={Colors.textMuted} />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nova Senha</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={18} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.gold} size="small" />
              ) : (
                <Text style={styles.secondaryBtnText}>Alterar Senha</Text>
              )}
            </Pressable>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!!success && (
            <View style={styles.successBox}>
              <Feather name="check-circle" size={14} color={Colors.success} />
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  headerSection: {
    marginBottom: 32,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.text,
    marginBottom: 6,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  form: {
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionBorder: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
    marginBottom: 8,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  helperText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
  },
  eyeBtn: {
    padding: 4,
  },
  primaryBtn: {
    height: 54,
    backgroundColor: Colors.gold,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.black,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    height: 54,
    backgroundColor: "transparent",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  secondaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.error + "15",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.error,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.success + "15",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  successText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.success,
  },
});
