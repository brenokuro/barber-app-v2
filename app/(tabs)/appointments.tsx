import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
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
      <Text style={[styles.badgeText, { color }]}>{STATUS_LABELS[status] || status}</Text>
    </View>
  );
}

function AppointmentCard({ item, onCancel }: { item: Appointment; onCancel: (id: string) => void }) {
  const canCancel = item.status === "pending" || item.status === "confirmed";
  const isPast = new Date(item.starts_at) < new Date();

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Feather name="scissors" size={18} color={Colors.gold} />
        </View>
        <View style={styles.cardMain}>
          <Text style={styles.cardService}>{item.service_name}</Text>
          <Text style={styles.cardTime}>{formatDateTime(item.starts_at)}</Text>
          <Text style={styles.cardDuration}>{item.service_duration} min</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardPrice}>{formatPrice(item.price_cents)}</Text>
          <StatusBadge status={item.status} />
        </View>
      </View>
      {canCancel && !isPast && (
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
          onPress={() => onCancel(item.id)}
        >
          <Feather name="x" size={14} color={Colors.error} />
          <Text style={styles.cancelText}>Cancelar agendamento</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

  const { data, isLoading, error, refetch, isRefetching } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}/status`, { status: "cancelled" });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/appointments"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleCancel = (id: string) => {
    Alert.alert("Cancelar agendamento", "Tem certeza que deseja cancelar?", [
      { text: "Voltar", style: "cancel" },
      {
        text: "Cancelar",
        style: "destructive",
        onPress: () => cancelMutation.mutate(id),
      },
    ]);
  };

  const now = new Date();
  const upcoming = data?.filter((a) => new Date(a.starts_at) >= now && a.status !== "cancelled") ?? [];
  const past = data?.filter((a) => new Date(a.starts_at) < now || a.status === "cancelled") ?? [];
  const shown = filter === "upcoming" ? upcoming : past;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Agendamentos</Text>
      </View>

      <View style={styles.filterRow}>
        {(["upcoming", "past"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "upcoming" ? "Próximos" : "Histórico"}
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
          data={shown}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
              <Text style={styles.emptyTitle}>
                {filter === "upcoming" ? "Nenhum agendamento" : "Sem histórico"}
              </Text>
              <Text style={styles.emptyText}>
                {filter === "upcoming" ? "Agende um serviço na aba Início" : "Seus agendamentos aparecerão aqui"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AppointmentCard item={item} onCancel={handleCancel} />
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
    paddingHorizontal: 16,
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
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.gold,
  },
  listContent: {
    padding: 20,
    gap: 12,
    paddingBottom: Platform.OS === "web" ? 40 : 120,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: Colors.gold + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  cardMain: {
    flex: 1,
    gap: 3,
  },
  cardService: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  cardTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cardDuration: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  cardPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.gold,
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
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.error,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
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
