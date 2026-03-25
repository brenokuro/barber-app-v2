import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  created_at: string;
  read: boolean;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Mock notifications - depois integrar com backend
  const { data: notifications, isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => [
      {
        id: "1",
        title: "Novo agendamento",
        message: "João Silva agendou um corte para hoje às 14:00",
        type: "info",
        created_at: new Date().toISOString(),
        read: false,
      },
      {
        id: "2", 
        title: "Pagamento confirmado",
        message: "Maria Santos pagou o pacote de 3 cortes",
        type: "success",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        read: false,
      },
      {
        id: "3",
        title: "Lembrete",
        message: "Você tem 3 agendamentos amanhã",
        type: "warning",
        created_at: new Date(Date.now() - 7200000).toISOString(),
        read: true,
      },
    ],
  });

  const clearNotificationsMutation = useMutation({
    mutationFn: async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ok: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ok: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} h`;
    return `${Math.floor(diffMins / 1440)} d`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return "check-circle";
      case "warning": return "alert-triangle";
      case "error": return "x-circle";
      default: return "info";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success": return Colors.success;
      case "warning": return Colors.warning;
      case "error": return Colors.error;
      default: return Colors.gold;
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificações</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.clearBtn}
            onPress={() => {
              Alert.alert(
                "Limpar notificações",
                "Marcar todas como lidas?",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Limpar",
                    onPress: () => clearNotificationsMutation.mutate(),
                  },
                ]
              );
            }}
          >
            <Feather name="check-square" size={16} color={Colors.gold} />
            <Text style={styles.clearBtnText}>Marcar todas como lidas</Text>
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={Colors.gold}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="bell" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nenhuma notificação</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.notification, !item.read && styles.unread]}
              onPress={() => !item.read && markAsReadMutation.mutate(item.id)}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIcon}>
                  <Feather
                    name={getNotificationIcon(item.type)}
                    size={16}
                    color={getNotificationColor(item.type)}
                  />
                </View>
                <Text style={styles.notificationTime}>{formatTime(item.created_at)}</Text>
              </View>
              
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              
              {!item.read && (
                <View style={styles.unreadDot} />
              )}
            </Pressable>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  unreadBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unreadText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.black,
  },
  actionsRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  clearBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.gold,
  },
  list: {
    padding: 20,
    gap: 12,
  },
  notification: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    position: "relative",
  },
  unread: {
    backgroundColor: Colors.gold + "10",
    borderColor: Colors.gold + "30",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notificationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  notificationTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  notificationMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
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
});
