import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/auth";
import { apiRequest, getApiUrl } from "@/lib/query-client";

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

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

function getDatesRange(days = 30) {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dow = d.getDay();
    if (dow === 0) continue; // Skip Sundays
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

function DateButton({ date, selected, onPress }: { date: string; selected: boolean; onPress: () => void }) {
  const d = new Date(date + "T12:00:00");
  const dayName = d.toLocaleDateString("pt-BR", { weekday: "short" });
  const dayNum = d.getDate();
  const isToday = date === new Date().toISOString().slice(0, 10);

  return (
    <Pressable
      style={[styles.dateBtn, selected && styles.dateBtnSelected]}
      onPress={onPress}
    >
      <Text style={[styles.dateDayName, selected && styles.dateDayNameSelected]}>
        {isToday ? "Hoje" : dayName}
      </Text>
      <Text style={[styles.dateDayNum, selected && styles.dateDayNumSelected]}>{dayNum}</Text>
    </Pressable>
  );
}

type Step = "service" | "date" | "time" | "confirm";

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const { serviceId: paramServiceId } = useLocalSearchParams<{ serviceId?: string }>();
  const { token } = useAuth();
  const qc = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [step, setStep] = useState<Step>(paramServiceId ? "date" : "service");
  const [selectedServiceId, setSelectedServiceId] = useState<string>(paramServiceId ?? "");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  const dates = getDatesRange(30);

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const selectedService = services?.find((s) => s.id === selectedServiceId);

  const { data: slots, isLoading: slotsLoading } = useQuery<string[]>({
    queryKey: ["/api/slots", selectedServiceId, selectedDate],
    queryFn: async () => {
      if (!selectedServiceId || !selectedDate) return [];
      const url = new URL("/api/slots", getApiUrl());
      url.searchParams.set("serviceId", selectedServiceId);
      url.searchParams.set("date", selectedDate);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    enabled: !!selectedServiceId && !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedService || !selectedSlot) throw new Error("Dados incompletos");
      const startsAt = new Date(selectedSlot);
      const endsAt = new Date(startsAt.getTime() + selectedService.duration_minutes * 60000);
      const res = await apiRequest("POST", "/api/appointments", {
        service_id: selectedServiceId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        price_cents: selectedService.price_cents,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/appointments"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Agendado!",
        `Seu agendamento de ${selectedService?.name} foi solicitado com sucesso. Aguarde a confirmação.`,
        [{ text: "OK", onPress: () => router.dismiss() }]
      );
    },
    onError: (e: any) => {
      Alert.alert("Erro", e.message || "Não foi possível agendar");
    },
  });

  const goBack = useCallback(() => {
    if (step === "service") router.dismiss();
    else if (step === "date") setStep(paramServiceId ? "service" : "service");
    else if (step === "time") setStep("date");
    else if (step === "confirm") setStep("time");
  }, [step]);

  const stepIndex = ["service", "date", "time", "confirm"].indexOf(step);
  const totalSteps = 4;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Feather name="x" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Agendar Serviço</Text>
        <View style={styles.stepIndicator}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {step === "service" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Escolha o serviço</Text>
            {servicesLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color={Colors.gold} />
              </View>
            ) : (
              services?.map((svc) => (
                <Pressable
                  key={svc.id}
                  style={({ pressed }) => [
                    styles.selectCard,
                    selectedServiceId === svc.id && styles.selectCardActive,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => {
                    setSelectedServiceId(svc.id);
                    setSelectedDate("");
                    setSelectedSlot("");
                  }}
                >
                  <View style={styles.selectCardIcon}>
                    <Feather name="scissors" size={20} color={selectedServiceId === svc.id ? Colors.black : Colors.gold} />
                  </View>
                  <View style={styles.selectCardInfo}>
                    <Text style={[styles.selectCardName, selectedServiceId === svc.id && { color: Colors.black }]}>
                      {svc.name}
                    </Text>
                    <Text style={[styles.selectCardSub, selectedServiceId === svc.id && { color: Colors.black + "99" }]}>
                      {svc.duration_minutes} min
                    </Text>
                  </View>
                  <Text style={[styles.selectCardPrice, selectedServiceId === svc.id && { color: Colors.black }]}>
                    {formatPrice(svc.price_cents)}
                  </Text>
                </Pressable>
              ))
            )}
            <Pressable
              style={[styles.nextBtn, !selectedServiceId && { opacity: 0.4 }]}
              onPress={() => {
                if (!selectedServiceId) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("date");
              }}
              disabled={!selectedServiceId}
            >
              <Text style={styles.nextBtnText}>Próximo</Text>
              <Feather name="arrow-right" size={18} color={Colors.black} />
            </Pressable>
          </View>
        )}

        {step === "date" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Escolha a data</Text>
            <Text style={styles.stepSub}>Selecione um dia disponível</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesRow}
            >
              {dates.map((d) => (
                <DateButton
                  key={d}
                  date={d}
                  selected={selectedDate === d}
                  onPress={() => {
                    setSelectedDate(d);
                    setSelectedSlot("");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                />
              ))}
            </ScrollView>
            {selectedDate && (
              <Text style={styles.selectedDateLabel}>{formatDateLabel(selectedDate)}</Text>
            )}
            <Pressable
              style={[styles.nextBtn, !selectedDate && { opacity: 0.4 }]}
              onPress={() => {
                if (!selectedDate) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("time");
              }}
              disabled={!selectedDate}
            >
              <Text style={styles.nextBtnText}>Próximo</Text>
              <Feather name="arrow-right" size={18} color={Colors.black} />
            </Pressable>
          </View>
        )}

        {step === "time" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Escolha o horário</Text>
            <Text style={styles.stepSub}>{selectedDate ? formatDateLabel(selectedDate) : ""}</Text>
            {slotsLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color={Colors.gold} />
              </View>
            ) : slots?.length === 0 ? (
              <View style={styles.center}>
                <Feather name="calendar-x" size={36} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Sem horários disponíveis</Text>
                <Text style={styles.emptyText}>Escolha outra data</Text>
                <Pressable style={styles.outlineBtn} onPress={() => setStep("date")}>
                  <Text style={styles.outlineBtnText}>Mudar data</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {slots?.map((slot) => (
                  <Pressable
                    key={slot}
                    style={[styles.slotBtn, selectedSlot === slot && styles.slotBtnActive]}
                    onPress={() => {
                      setSelectedSlot(slot);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>
                      {formatTime(slot)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {slots && slots.length > 0 && (
              <Pressable
                style={[styles.nextBtn, !selectedSlot && { opacity: 0.4 }]}
                onPress={() => {
                  if (!selectedSlot) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStep("confirm");
                }}
                disabled={!selectedSlot}
              >
                <Text style={styles.nextBtnText}>Próximo</Text>
                <Feather name="arrow-right" size={18} color={Colors.black} />
              </Pressable>
            )}
          </View>
        )}

        {step === "confirm" && selectedService && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirmar agendamento</Text>
            <View style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <View style={styles.confirmIcon}>
                  <Feather name="scissors" size={22} color={Colors.gold} />
                </View>
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Serviço</Text>
                  <Text style={styles.confirmValue}>{selectedService.name}</Text>
                </View>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <View style={styles.confirmIcon}>
                  <Feather name="calendar" size={22} color={Colors.gold} />
                </View>
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Data</Text>
                  <Text style={styles.confirmValue}>{formatDateLabel(selectedDate)}</Text>
                </View>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <View style={styles.confirmIcon}>
                  <Feather name="clock" size={22} color={Colors.gold} />
                </View>
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Horário</Text>
                  <Text style={styles.confirmValue}>{formatTime(selectedSlot)}</Text>
                </View>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <View style={styles.confirmIcon}>
                  <Feather name="clock" size={22} color={Colors.gold} />
                </View>
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Duração</Text>
                  <Text style={styles.confirmValue}>{selectedService.duration_minutes} minutos</Text>
                </View>
              </View>
              <View style={[styles.confirmDivider, { marginBottom: 4 }]} />
              <View style={styles.confirmTotal}>
                <Text style={styles.confirmTotalLabel}>Total</Text>
                <Text style={styles.confirmTotalValue}>{formatPrice(selectedService.price_cents)}</Text>
              </View>
            </View>

            <Text style={styles.confirmNote}>
              O agendamento ficará pendente até a confirmação do barbeiro.
            </Text>

            <Pressable
              style={[styles.nextBtn, bookMutation.isPending && { opacity: 0.7 }]}
              onPress={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
            >
              {bookMutation.isPending ? (
                <ActivityIndicator color={Colors.black} size="small" />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color={Colors.black} />
                  <Text style={styles.nextBtnText}>Confirmar agendamento</Text>
                </>
              )}
            </Pressable>
          </View>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  stepIndicator: {
    flexDirection: "row",
    gap: 5,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.gold,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 60,
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  stepSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  selectCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectCardActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  selectCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.gold + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  selectCardInfo: {
    flex: 1,
    gap: 3,
  },
  selectCardName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  selectCardSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  selectCardPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.gold,
  },
  nextBtn: {
    height: 54,
    backgroundColor: Colors.gold,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  nextBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.black,
  },
  datesRow: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  dateBtn: {
    width: 56,
    height: 68,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  dateBtnSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  dateDayName: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "capitalize",
  },
  dateDayNameSelected: {
    color: Colors.black,
  },
  dateDayNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  dateDayNumSelected: {
    color: Colors.black,
  },
  selectedDateLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.gold,
    textTransform: "capitalize",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slotBtnActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  slotText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text,
  },
  slotTextActive: {
    color: Colors.black,
  },
  confirmCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  confirmIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.gold + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmInfo: {
    flex: 1,
    gap: 2,
  },
  confirmLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  confirmValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    textTransform: "capitalize",
  },
  confirmDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  confirmTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  confirmTotalLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  confirmTotalValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.gold,
  },
  confirmNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  center: {
    alignItems: "center",
    paddingVertical: 40,
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
  },
  outlineBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  outlineBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.gold,
  },
});
