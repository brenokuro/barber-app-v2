import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { useAuth } from "@/context/auth";

interface LoyaltySettings {
  enabled: boolean;
  visitsRequired: number;
  rewardType: "free_cut" | "discount";
  discountPercentage?: number;
}

export default function LoyaltyScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [settings, setSettings] = useState<LoyaltySettings>({
    enabled: false,
    visitsRequired: 5,
    rewardType: "free_cut",
    discountPercentage: 20,
  });

  // Mock API - depois integrar com backend
  const { data: currentSettings, isLoading } = useQuery<LoyaltySettings>({
    queryKey: ["/api/loyalty/settings"],
    queryFn: async () => settings,
    enabled: user?.role === "admin",
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: LoyaltySettings) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ok: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/loyalty/settings"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Configurações de fidelidade atualizadas!");
    },
    onError: (e: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", e.message || "Erro ao atualizar configurações");
    },
  });

  const handleSave = () => {
    if (settings.enabled && settings.visitsRequired < 2) {
      Alert.alert("Erro", "Número mínimo de visitas deve ser 2");
      return;
    }
    
    if (settings.rewardType === "discount" && (!settings.discountPercentage || settings.discountPercentage < 1 || settings.discountPercentage > 100)) {
      Alert.alert("Erro", "Percentual de desconto deve estar entre 1% e 100%");
      return;
    }

    updateSettingsMutation.mutate(settings);
  };

  // Se não for admin, mostrar status da fidelidade do cliente
  if (user?.role !== "admin") {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Programa de Fidelidade</Text>
        </View>

        <View style={styles.clientContainer}>
          <View style={styles.clientCard}>
            <Feather name="award" size={40} color={Colors.gold} />
            <Text style={styles.clientTitle}>Programa não disponível</Text>
            <Text style={styles.clientDesc}>
              Esta barbearia ainda não habilitou um programa de fidelidade.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Programa de Fidelidade</Text>
        <Text style={styles.headerDesc}>Configure recompensas para clientes fiéis</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Habilitar Programa</Text>
              <Text style={styles.settingDesc}>
                Ative o programa de fidelidade para seus clientes
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => setSettings({ ...settings, enabled: value })}
              trackColor={{ false: Colors.border, true: Colors.gold + "50" }}
              thumbColor={settings.enabled ? Colors.gold : Colors.textMuted}
            />
          </View>

          {settings.enabled && (
            <>
              <View style={styles.divider} />

              <View style={styles.settingGroup}>
                <Text style={styles.groupTitle}>Configurações do Programa</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Visitas necessárias</Text>
                  <TextInput
                    style={styles.input}
                    value={settings.visitsRequired.toString()}
                    onChangeText={(text) => setSettings({ ...settings, visitsRequired: parseInt(text) || 1 })}
                    keyboardType="numeric"
                    placeholder="Ex: 5"
                  />
                  <Text style={styles.helperText}>
                    Após quantos cortes o cliente ganha a recompensa
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tipo de Recompensa</Text>
                  <View style={styles.rewardOptions}>
                    <Pressable
                      style={[
                        styles.rewardOption,
                        settings.rewardType === "free_cut" && styles.rewardOptionSelected,
                      ]}
                      onPress={() => setSettings({ ...settings, rewardType: "free_cut" })}
                    >
                      <Feather
                        name="scissors"
                        size={20}
                        color={settings.rewardType === "free_cut" ? Colors.gold : Colors.textMuted}
                      />
                      <View>
                        <Text style={[
                          styles.rewardTitle,
                          settings.rewardType === "free_cut" && styles.rewardTitleSelected,
                        ]}>
                          Corte Grátis
                        </Text>
                        <Text style={styles.rewardDesc}>
                          Cliente ganha um serviço gratuito
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.rewardOption,
                        settings.rewardType === "discount" && styles.rewardOptionSelected,
                      ]}
                      onPress={() => setSettings({ ...settings, rewardType: "discount" })}
                    >
                      <Feather
                        name="percent"
                        size={20}
                        color={settings.rewardType === "discount" ? Colors.gold : Colors.textMuted}
                      />
                      <View>
                        <Text style={[
                          styles.rewardTitle,
                          settings.rewardType === "discount" && styles.rewardTitleSelected,
                        ]}>
                          Desconto
                        </Text>
                        <Text style={styles.rewardDesc}>
                          Cliente ganha desconto no próximo corte
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>

                {settings.rewardType === "discount" && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Percentual de Desconto</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={settings.discountPercentage?.toString() || ""}
                        onChangeText={(text) => setSettings({ ...settings, discountPercentage: parseInt(text) || 0 })}
                        keyboardType="numeric"
                        placeholder="20"
                      />
                      <Text style={styles.percentSymbol}>%</Text>
                    </View>
                    <Text style={styles.helperText}>
                      Desconto que o cliente receberá
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {settings.enabled && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Como funcionará:</Text>
            <View style={styles.previewItem}>
              <Feather name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.previewText}>
                Cliente precisa completar {settings.visitsRequired} cortes
              </Text>
            </View>
            <View style={styles.previewItem}>
              <Feather name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.previewText}>
                Após completar, ganha{" "}
                {settings.rewardType === "free_cut" 
                  ? "1 corte grátis" 
                  : `${settings.discountPercentage}% de desconto`
                }
              </Text>
            </View>
            <View style={styles.previewItem}>
              <Feather name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.previewText}>
                Contador reinicia após receber a recompensa
              </Text>
            </View>
          </View>
        )}

        {settings.enabled && (
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSave}
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? (
              <Text style={styles.saveBtnText}>Salvando...</Text>
            ) : (
              <Text style={styles.saveBtnText}>Salvar Configurações</Text>
            )}
          </Pressable>
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    marginBottom: 4,
  },
  headerDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  settingGroup: {
    gap: 20,
  },
  groupTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  percentSymbol: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.gold,
    marginLeft: 8,
  },
  helperText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  rewardOptions: {
    gap: 12,
  },
  rewardOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  rewardOptionSelected: {
    backgroundColor: Colors.gold + "15",
    borderColor: Colors.gold,
  },
  rewardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  rewardTitleSelected: {
    color: Colors.gold,
  },
  rewardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  previewCard: {
    backgroundColor: Colors.success + "10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success + "30",
    padding: 16,
    gap: 12,
  },
  previewTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.success,
    marginBottom: 4,
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  saveBtn: {
    height: 54,
    backgroundColor: Colors.gold,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.black,
    letterSpacing: 0.5,
  },
  clientContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  clientCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  clientTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
    textAlign: "center",
  },
  clientDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
