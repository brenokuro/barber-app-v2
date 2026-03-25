import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useSafeAreaInsets,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

export default function LoginSelectionScreen() {
  const insets = useSafeAreaInsets();

  const handleClientLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/login-client");
  };

  const handleBarberLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/login-barber");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Feather name="scissors" size={40} color={Colors.gold} />
          </View>
          <Text style={styles.title}>Como você quer acessar?</Text>
          <Text style={styles.subtitle}>Escolha o tipo de acesso para continuar</Text>
        </View>

        <View style={styles.options}>
          <Pressable style={styles.optionCard} onPress={handleClientLogin}>
            <View style={styles.optionIcon}>
              <Feather name="user" size={32} color={Colors.gold} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Cliente</Text>
              <Text style={styles.optionDescription}>
                Agende horários, acompanhe seus cortes e aproveite benefícios
              </Text>
            </View>
            <View style={styles.optionArrow}>
              <Feather name="chevron-right" size={20} color={Colors.textMuted} />
            </View>
          </Pressable>

          <Pressable style={styles.optionCard} onPress={handleBarberLogin}>
            <View style={styles.optionIcon}>
              <Feather name="shield" size={32} color={Colors.gold} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Barbearia</Text>
              <Text style={styles.optionDescription}>
                Gerencie agendamentos, serviços e sua equipe
              </Text>
            </View>
            <View style={styles.optionArrow}>
              <Feather name="chevron-right" size={20} color={Colors.textMuted} />
            </View>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ainda não tem uma conta?</Text>
          <View style={styles.footerButtons}>
            <Pressable onPress={() => router.push("/(auth)/register-client")}>
              <Text style={styles.signUpText}>Criar conta cliente</Text>
            </Pressable>
            <Text style={styles.separator}>•</Text>
            <Pressable onPress={() => router.push("/(auth)/register-barber")}>
              <Text style={styles.signUpText}>Cadastrar barbearia</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={Colors.gold} />
          <Text style={styles.backBtnText}>Voltar</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gold + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: "center",
  },
  options: {
    gap: 16,
    marginBottom: 40,
  },
  optionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gold + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: Colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  optionArrow: {
    padding: 8,
  },
  footer: {
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  footerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  signUpText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.gold,
  },
  separator: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
  },
  backBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.gold,
  },
});
