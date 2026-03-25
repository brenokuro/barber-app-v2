import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/auth";
import { useQuery } from "@tanstack/react-query";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
  image_url?: string;
}

interface Package {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  credits: number;
  period_days: number;
}

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Mock data - substituir com API real
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => [
      {
        id: "1",
        name: "Corte Masculino",
        description: "Corte tradicional com máquina e tesoura",
        price_cents: 3500,
        duration_minutes: 30,
      },
      {
        id: "2",
        name: "Barba",
        description: "Acabamento e modelagem de barba",
        price_cents: 2500,
        duration_minutes: 20,
      },
      {
        id: "3",
        name: "Corte + Barba",
        description: "Pacote completo com desconto",
        price_cents: 5000,
        duration_minutes: 50,
      },
    ],
  });

  const { data: packages = [] } = useQuery<Package[]>({
    queryKey: ["packages"],
    queryFn: async () => [
      {
        id: "1",
        name: "Pacote 3 Cortes",
        description: "Pague 3 e ganhe 10% de desconto",
        price_cents: 9450,
        credits: 3,
        period_days: 90,
      },
      {
        id: "2",
        name: "Pacote Mensal",
        description: "4 cortes por mês com economia",
        price_cents: 12600,
        credits: 4,
        period_days: 30,
      },
    ],
  });

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Serviços</Text>
        <Text style={styles.headerSubtitle}>Escolha o serviço desejado</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços Individuais</Text>
          <View style={styles.grid}>
            {services.map((service) => (
              <Pressable key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceImage}>
                  <Feather name="scissors" size={24} color={Colors.gold} />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {service.description && (
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                  )}
                  <View style={styles.serviceMeta}>
                    <Text style={styles.serviceDuration}>{service.duration_minutes}min</Text>
                    <Text style={styles.servicePrice}>{formatPrice(service.price_cents)}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pacotes Economize</Text>
          <View style={styles.packageList}>
            {packages.map((pkg) => (
              <Pressable key={pkg.id} style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <View style={styles.packageBadge}>
                    <Text style={styles.packageBadgeText}>{pkg.credits} cortes</Text>
                  </View>
                </View>
                {pkg.description && (
                  <Text style={styles.packageDescription}>{pkg.description}</Text>
                )}
                <View style={styles.packageFooter}>
                  <Text style={styles.packageValidity}>Válido por {pkg.period_days} dias</Text>
                  <Text style={styles.packagePrice}>{formatPrice(pkg.price_cents)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.text,
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
    marginBottom: 16,
  },
  grid: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    gap: 12,
  },
  serviceImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.gold + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  serviceDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  serviceMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  serviceDuration: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textMuted,
  },
  servicePrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.gold,
  },
  packageList: {
    gap: 12,
  },
  packageCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  packageName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  packageBadge: {
    backgroundColor: Colors.gold + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  packageBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.gold,
  },
  packageDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  packageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  packageValidity: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textMuted,
  },
  packagePrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.gold,
  },
});
