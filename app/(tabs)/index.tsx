import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/auth";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
}

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function ServiceCard({ service }: { service: Service }) {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/booking", params: { serviceId: service.id } });
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.serviceCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
      onPress={handlePress}
    >
      <View style={styles.serviceIcon}>
        <Feather name="scissors" size={22} color={Colors.gold} />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{service.name}</Text>
        {service.description ? (
          <Text style={styles.serviceDesc} numberOfLines={1}>{service.description}</Text>
        ) : null}
        <View style={styles.serviceMeta}>
          <View style={styles.metaChip}>
            <Feather name="clock" size={11} color={Colors.textMuted} />
            <Text style={styles.metaText}>{service.duration_minutes} min</Text>
          </View>
        </View>
      </View>
      <View style={styles.servicePriceCol}>
        <Text style={styles.servicePrice}>{formatPrice(service.price_cents)}</Text>
        <View style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>Agendar</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: services, isLoading, error, refetch } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(" ")[0]}</Text>
          <Text style={styles.headerTitle}>Nossos Serviços</Text>
        </View>
        <View style={styles.logoMark}>
          <Feather name="scissors" size={20} color={Colors.gold} />
        </View>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Arte e Precisão</Text>
            <Text style={styles.bannerSub}>Seu estilo, nossa dedicação</Text>
          </View>
          <View style={styles.bannerDeco}>
            <Feather name="award" size={40} color={Colors.gold + "40"} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Serviços disponíveis</Text>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.gold} />
          </View>
        )}

        {!!error && (
          <View style={styles.errorState}>
            <Feather name="wifi-off" size={32} color={Colors.textMuted} />
            <Text style={styles.errorText}>Não foi possível carregar</Text>
            <Pressable style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !error && services?.length === 0 && (
          <View style={styles.center}>
            <Feather name="inbox" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nenhum serviço disponível</Text>
          </View>
        )}

        {services?.map((svc) => (
          <ServiceCard key={svc.id} service={svc} />
        ))}

        <Text style={styles.sectionTitle}>Horário de funcionamento</Text>
        <View style={styles.hoursCard}>
          {[
            { day: "Segunda a Sexta", hours: "09:00 – 19:00" },
            { day: "Sábado", hours: "09:00 – 17:00" },
            { day: "Domingo", hours: "Fechado" },
          ].map((h) => (
            <View key={h.day} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{h.day}</Text>
              <Text style={[styles.hoursTime, h.hours === "Fechado" && { color: Colors.error }]}>
                {h.hours}
              </Text>
            </View>
          ))}
        </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === "web" ? 40 : 120,
    gap: 12,
  },
  bannerCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    marginBottom: 4,
  },
  bannerContent: {
    gap: 4,
  },
  bannerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.gold,
  },
  bannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bannerDeco: {},
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 4,
  },
  serviceCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.gold + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceInfo: {
    flex: 1,
    gap: 3,
  },
  serviceName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  serviceDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  serviceMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  servicePriceCol: {
    alignItems: "flex-end",
    gap: 6,
  },
  servicePrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.gold,
  },
  bookBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  bookBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.black,
  },
  hoursCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hoursDay: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  hoursTime: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  center: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  errorState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
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
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
