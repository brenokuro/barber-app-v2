import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/auth";
import { useQuery } from "@tanstack/react-query";

interface Package {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  credits: number;
  period_days: number;
}

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: packages } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
  });

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          logout();
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Erro", "Nome é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      // Mock API call - substituir com API real
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      setShowEditModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Erro", "Preencha todos os campos de senha");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      // Mock API call - substituir com API real
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert("Sucesso", "Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível alterar a senha");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 40 : 120 },
        ]}
      >
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.role === "admin" && (
              <View style={styles.adminBadge}>
                <Feather name="shield" size={11} color={Colors.gold} />
                <Text style={styles.adminBadgeText}>Administrador</Text>
              </View>
            )}
          </View>
          <Pressable
            style={styles.editBtn}
            onPress={() => setShowEditModal(true)}
          >
            <Feather name="edit-2" size={16} color={Colors.gold} />
          </Pressable>
        </View>

        {user?.phone ? (
          <View style={styles.infoRow}>
            <Feather name="phone" size={16} color={Colors.textMuted} />
            <Text style={styles.infoText}>{user.phone}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Planos & Assinaturas</Text>

        {packages?.map((pkg) => (
          <View key={pkg.id} style={styles.packageCard}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              <Text style={styles.packagePrice}>{formatPrice(pkg.price_cents)}</Text>
            </View>
            {pkg.description ? (
              <Text style={styles.packageDesc}>{pkg.description}</Text>
            ) : null}
            <View style={styles.packageMeta}>
              <View style={styles.chip}>
                <Feather name="scissors" size={11} color={Colors.gold} />
                <Text style={styles.chipText}>{pkg.credits} créditos</Text>
              </View>
              <View style={styles.chip}>
                <Feather name="calendar" size={11} color={Colors.gold} />
                <Text style={styles.chipText}>{pkg.period_days} dias</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.subscribeBtn, pressed && { opacity: 0.85 }]}
              onPress={() => Alert.alert("Plano", "Em breve: pagamento via PIX ou Cartão")}
            >
              <Text style={styles.subscribeBtnText}>Contratar plano</Text>
            </Pressable>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Conta</Text>

        <View style={styles.menuCard}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            onPress={() => setShowEditModal(true)}
          >
            <Feather name="edit-2" size={18} color={Colors.textSecondary} />
            <Text style={styles.menuLabel}>Editar perfil</Text>
            <Feather name="chevron-right" size={16} color={Colors.textMuted} />
          </Pressable>
          <View style={styles.menuDivider} />
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            onPress={() => Alert.alert("Em breve", "Notificações disponíveis em breve")}
          >
            <Feather name="bell" size={18} color={Colors.textSecondary} />
            <Text style={styles.menuLabel}>Notificações</Text>
            <Feather name="chevron-right" size={16} color={Colors.textMuted} />
          </Pressable>
          <View style={styles.menuDivider} />
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={18} color={Colors.error} />
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Sair</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal de Edição */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowEditModal(false)}>
              <Feather name="x" size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Informações Pessoais</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Seu nome"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="(00) 00000-0000"
                  keyboardType="phone-pad"
                />
              </View>

              <Pressable
                style={[styles.saveBtn, isLoading && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.black} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar Perfil</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Alterar Senha</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha Atual</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Digite sua senha atual"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Digite a nova senha"
                  secureTextEntry
                />
              </View>

              <Pressable
                style={[styles.saveBtn, isLoading && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.black} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Alterar Senha</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gold + "25",
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.gold,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  userEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.gold + "15",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  adminBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.gold,
  },
  editBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.gold + "15",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 8,
  },
  packageCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gold + "25",
    gap: 10,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  packageName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  packagePrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.gold,
  },
  packageDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  packageMeta: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.gold + "10",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.gold,
  },
  subscribeBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  subscribeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.black,
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 32,
  },
  formSectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.black,
  },
});
