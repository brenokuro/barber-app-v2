import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { apiRequest } from "@/lib/query-client";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
  active: boolean;
}

interface Package {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  credits: number;
  period_days: number;
  active: boolean;
}

export default function AdminManagerScreen() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"services" | "packages">("services");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Service | Package | null>(null);

  // Services
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: Partial<Service>) => {
      const res = await apiRequest("POST", "/api/services", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/services"] });
      setShowModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Service> & { id: string }) => {
      const res = await apiRequest("PUT", `/api/services/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/services"] });
      setShowModal(false);
      setEditingItem(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  // Packages
  const { data: packages, isLoading: packagesLoading } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: Partial<Package>) => {
      const res = await apiRequest("POST", "/api/packages", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/packages"] });
      setShowModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Package> & { id: string }) => {
      const res = await apiRequest("PUT", `/api/packages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/packages"] });
      setShowModal(false);
      setEditingItem(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  const handleEdit = (item: Service | Package) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = (id: string, type: "service" | "package") => {
    Alert.alert(
      "Confirmar",
      `Deseja excluir este ${type === "service" ? "serviço" : "pacote"}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            // Implementar delete mutation
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const formatPrice = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

  const renderServiceForm = () => (
    <View style={styles.form}>
      <Text style={styles.formTitle}>
        {editingItem ? "Editar Serviço" : "Novo Serviço"}
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nome do serviço"
        value={editingItem?.name || ""}
        onChangeText={(text) => setEditingItem(editingItem ? { ...editingItem, name: text } : { name: text, description: "", price_cents: 0, duration_minutes: 30, active: true } as any)}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descrição (opcional)"
        multiline
        numberOfLines={3}
        value={editingItem?.description || ""}
        onChangeText={(text) => setEditingItem(editingItem ? { ...editingItem, description: text } : { name: "", description: text, price_cents: 0, duration_minutes: 30, active: true } as any)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Preço (centavos)"
        keyboardType="numeric"
        value={editingItem?.price_cents?.toString() || ""}
        onChangeText={(text) => setEditingItem(editingItem ? { ...editingItem, price_cents: parseInt(text) || 0 } : { name: "", description: "", price_cents: parseInt(text) || 0, duration_minutes: 30, active: true } as any)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Duração (minutos)"
        keyboardType="numeric"
        value={editingItem?.duration_minutes?.toString() || ""}
        onChangeText={(text) => setEditingItem(editingItem ? { ...editingItem, duration_minutes: parseInt(text) || 0 } : { name: "", description: "", price_cents: 0, duration_minutes: parseInt(text) || 30, active: true } as any)}
      />

      <View style={styles.formActions}>
        <Pressable
          style={[styles.btn, styles.cancelBtn]}
          onPress={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
        >
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </Pressable>
        
        <Pressable
          style={[styles.btn, styles.saveBtn]}
          onPress={() => {
            if (editingItem) {
              if ("duration_minutes" in editingItem) {
                if (editingItem.id) {
                  updateServiceMutation.mutate(editingItem);
                } else {
                  createServiceMutation.mutate(editingItem);
                }
              }
            }
          }}
        >
          <Text style={styles.saveBtnText}>Salvar</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderPackageForm = () => (
    <View style={styles.form}>
      <Text style={styles.formTitle}>
        {editingItem ? "Editar Pacote" : "Novo Pacote"}
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nome do pacote"
        value={editingItem?.name || ""}
        onChangeText={(text) => setEditingItem(editingItem ? { ...editingItem, name: text } : { name: text, description: "", price_cents: 0, credits: 1, period_days: 30, active: true } as any)}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descrição (opcional)"
        multiline
        numberOfLines={3}
        value={editingItem?.description || ""}
        onChangeText={(text) => setEditingItem(editingItem ? { ...editingItem, description: text } : { name: "", description: text, price_cents: 0, credits: 1, period_days: 30, active: true } as any)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Preço (centavos)"
        keyboardType="numeric"
        value={editingItem?.price_cents?.toString() || ""}
        onChangeText={(text) => setEditingItem(editingItem ? { ...editingItem, price_cents: parseInt(text) || 0 } : { name: "", description: "", price_cents: parseInt(text) || 0, credits: 1, period_days: 30, active: true } as any)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Créditos (quantidade de serviços)"
        keyboardType="numeric"
        value={editingItem?.credits?.toString() || ""}
        onChangeText={(text) => setEditingItem(editingItem ? { ...editingItem, credits: parseInt(text) || 0 } : { name: "", description: "", price_cents: 0, credits: parseInt(text) || 1, period_days: 30, active: true } as any)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Período (dias)"
        keyboardType="numeric"
        value={editingItem?.period_days?.toString() || ""}
        onChangeText={(text) => setEditingItem(editingItem ? { ...editingItem, period_days: parseInt(text) || 0 } : { name: "", description: "", price_cents: 0, credits: 1, period_days: parseInt(text) || 30, active: true } as any)}
      />

      <View style={styles.formActions}>
        <Pressable
          style={[styles.btn, styles.cancelBtn]}
          onPress={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
        >
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </Pressable>
        
        <Pressable
          style={[styles.btn, styles.saveBtn]}
          onPress={() => {
            if (editingItem) {
              if ("credits" in editingItem) {
                if (editingItem.id) {
                  updatePackageMutation.mutate(editingItem);
                } else {
                  createPackageMutation.mutate(editingItem);
                }
              }
            }
          }}
        >
          <Text style={styles.saveBtnText}>Salvar</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gerenciamento</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
        >
          <Feather name="plus" size={16} color={Colors.black} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "services" && styles.tabActive]}
          onPress={() => setActiveTab("services")}
        >
          <Text style={[styles.tabText, activeTab === "services" && styles.tabTextActive]}>
            Serviços
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "packages" && styles.tabActive]}
          onPress={() => setActiveTab("packages")}
        >
          <Text style={[styles.tabText, activeTab === "packages" && styles.tabTextActive]}>
            Pacotes
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "services" ? (
          servicesLoading ? (
            <ActivityIndicator color={Colors.gold} />
          ) : (
            services?.map((service) => (
              <View key={service.id} style={styles.item}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{service.name}</Text>
                  <Text style={styles.itemDescription}>{service.description}</Text>
                  <Text style={styles.itemPrice}>{formatPrice(service.price_cents)}</Text>
                  <Text style={styles.itemDuration}>{service.duration_minutes} min</Text>
                </View>
                <View style={styles.itemActions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => handleEdit(service)}
                  >
                    <Feather name="edit" size={16} color={Colors.gold} />
                  </Pressable>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => handleDelete(service.id, "service")}
                  >
                    <Feather name="trash-2" size={16} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
            ))
          )
        ) : (
          packagesLoading ? (
            <ActivityIndicator color={Colors.gold} />
          ) : (
            packages?.map((pkg) => (
              <View key={pkg.id} style={styles.item}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{pkg.name}</Text>
                  <Text style={styles.itemDescription}>{pkg.description}</Text>
                  <Text style={styles.itemPrice}>{formatPrice(pkg.price_cents)}</Text>
                  <Text style={styles.itemCredits}>{pkg.credits} créditos • {pkg.period_days} dias</Text>
                </View>
                <View style={styles.itemActions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => handleEdit(pkg)}
                  >
                    <Feather name="edit" size={16} color={Colors.gold} />
                  </Pressable>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => handleDelete(pkg.id, "package")}
                  >
                    <Feather name="trash-2" size={16} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          {activeTab === "services" ? renderServiceForm() : renderPackageForm()}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  addBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Colors.gold + "20",
    borderColor: Colors.gold,
  },
  tabText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.gold,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  item: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  itemDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  itemPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.gold,
    marginBottom: 2,
  },
  itemDuration: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemCredits: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  form: {
    flex: 1,
  },
  formTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: Colors.gold,
  },
  saveBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.black,
  },
});
