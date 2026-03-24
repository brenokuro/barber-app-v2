import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { apiRequest } from "@/lib/query-client";

interface Appointment {
  id: string;
  client_name: string;
  client_email: string;
  service_name: string;
  service_duration: number;
  starts_at: string;
  ends_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  price_cents: number;
  notes: string | null;
}

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

function StatusBadge({ status }: { status: string }) {
  const color = (Colors.statusColors as any)[status] || Colors.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

function AdminCard({
  item,
  onUpdate,
}: {
  item: Appointment;
  onUpdate: (id: string, status: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.clientInfo}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientInitial}>
              {item.client_name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <View>
            <Text style={styles.clientName}>{item.client_name}</Text>
            <Text style={styles.clientEmail}>{item.client_email}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Feather name="scissors" size={14} color={Colors.textMuted} />
          <Text style={styles.cardDetail}>{item.service_name}</Text>
        </View>
        <View style={styles.cardRow}>
          <Feather name="clock" size={14} color={Colors.textMuted} />
          <Text style={styles.cardDetail}>{formatDateTime(item.starts_at)}</Text>
        </View>
        <View style={styles.cardRow}>
          <Feather name="dollar-sign" size={14} color={Colors.textMuted} />
          <Text style={styles.cardDetail}>{formatPrice(item.price_cents)}</Text>
        </View>
      </View>

      {item.status === "pending" && (
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.8 }]}
            onPress={() => onUpdate(item.id, "confirmed")}
          >
            <Feather name="check" size={14} color={Colors.black} />
            <Text style={styles.confirmText}>Confirmar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.8 }]}
            onPress={() => onUpdate(item.id, "cancelled")}
          >
            <Feather name="x" size={14} color={Colors.error} />
            <Text style={styles.rejectText}>Rejeitar</Text>
          </Pressable>
        </View>
      )}
      {item.status === "confirmed" && (
        <Pressable
          style={({ pressed }) => [styles.completeBtn, pressed && { opacity: 0.8 }]}
          onPress={() => onUpdate(item.id, "completed")}
        >
          <Feather name="check-circle" size={14} color={Colors.success} />
          <Text style={styles.completeText}>Marcar como concluído</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");

  const { data, isLoading, error, refetch, isRefetching } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/appointments"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  const handleUpdate = (id: string, status: string) => {
    const labels: Record<string, string> = { confirmed: "Confirmar", cancelled: "Rejeitar", completed: "Concluir" };
    Alert.alert(labels[status] || "Atualizar", `${labels[status]} este agendamento?`, [
      { text: "Cancelar", style: "cancel" },
      { text: labels[status], onPress: () => updateMutation.mutate({ id, status }) },
    ]);
  };

  const filtered =
    filter === "all"
      ? data
      : data?.filter((a) => a.status === filter);

  const pending = data?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        {pending > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>{pending} aguardando</Text>
          </View>
        )}
      </View>

      <View style={styles.filterRow}>
        {(["all", "pending", "confirmed"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "Todos" : f === "pending" ? "Aguardando" : "Confirmados"}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      ) : !!error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Erro ao carregar</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Platform.OS === "web" ? 40 : 120 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={!!isRefetching}
              onRefresh={refetch}
              tintColor={Colors.gold}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="calendar" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum agendamento</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AdminCard item={item} onUpdate={handleUpdate} />
          )}
        />
      )}
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
  pendingBadge: {
    backgroundColor: Colors.warning + "20",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.warning + "50",
  },
  pendingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.warning,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.gold + "20",
    borderColor: Colors.gold,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.gold,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.gold + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  clientInitial: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.gold,
  },
  clientName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  clientEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  cardBody: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardDetail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 4,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: 11,
    paddingVertical: 10,
  },
  confirmText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.black,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.error + "15",
    borderRadius: 11,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.error + "40",
  },
  rejectText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.error,
  },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.success + "15",
    borderRadius: 11,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.success + "40",
  },
  completeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.success,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  retryBtn: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.gold,
  },
});
