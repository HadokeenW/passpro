"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/business/Card";
import { Button } from "@/components/business/Button";
import { StatusPill } from "@/components/business/StatusPill";
import { SubscriptionProgress } from "@/components/business/SubscriptionProgress";
import { BadgeRFID } from "@/components/business/BadgeRFID";
import { MemberModal } from "@/components/business/MemberModal";
import { PaymentModal } from "@/components/business/PaymentModal";
import { CardAssignModal } from "@/components/business/CardAssignModal";
import { ReceiptModal } from "@/components/business/ReceiptModal";
import { WebcamCaptureModal } from "@/components/business/WebcamCaptureModal";
import { Modal } from "@/components/business/Modal";
import { useToast } from "@/components/business/Toast";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import {
  CreditCard,
  RefreshCw,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  Printer,
  Ban,
  ShieldCheck,
  Check,
  X,
  ArrowLeft,
  Camera,
} from "lucide-react";

interface MemberDossier {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    photoUrl?: string | null;
    notes: string | null;
    createdAt: string;
  };
  cards: any[];
  currentSubscription: any | null;
  recentAccessLogs: any[];
  recentPayments: any[];
  stats: {
    totalPassages: number;
    totalSpent: number;
  };
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [dossier, setDossier] = useState<MemberDossier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const fetchDossier = () => {
    setIsLoading(true);
    fetch(`/api/members/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          toast.error("Erreur", data.error.message);
          router.push("/members");
        } else {
          setDossier(data);
          setInternalNotes(data.member.notes || "");
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDossier();
  }, [id]);

  const handleNotesBlur = async () => {
    if (!dossier || internalNotes === (dossier.member.notes || "")) return;
    try {
      await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: internalNotes }),
      });
      toast.success("Notes sauvegardées", "Les modifications sont enregistrées");
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCardBlock = async (cardUid: string, currentStatus: string) => {
    const action = currentStatus === "BLOCKED" ? "UNBLOCK" : "BLOCK";
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(cardUid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(
          action === "BLOCK" ? "Badge bloqué" : "Badge débloqué",
          `Le badge ${cardUid} est désormais ${action === "BLOCK" ? "bloqué" : "actif"}`
        );
        fetchDossier();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubscriptionSuspend = async (subId: string, isSuspended: boolean) => {
    const action = isSuspended ? "reactivate" : "suspend";
    try {
      const res = await fetch(`/api/subscriptions/${subId}/${action}`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success(
          isSuspended ? "Abonnement réactivé" : "Abonnement suspendu",
          `Le statut a été mis à jour`
        );
        fetchDossier();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMember = async () => {
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Adhérent archivé", "Le dossier a été archivé");
        setIsDeleteModalOpen(false);
        router.push("/members");
      } else {
        const d = await res.json();
        toast.error("Erreur d'archivage", d.error?.message || "Impossible d'archiver cet adhérent");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau", "Impossible de contacter le serveur");
    }
  };

  const handleSavePhoto = async (photoUrl: string) => {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl }),
      });
      if (res.ok) {
        toast.success("Photo mise à jour", "La photo d'identité est enregistrée");
        fetchDossier();
      } else {
        const d = await res.json();
        toast.error("Erreur", d.error?.message || "Impossible d'enregistrer la photo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau", "Impossible de joindre le serveur");
    }
  };

  const handleReprint = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/reprint`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setReceiptData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !dossier) {
    return (
      <div className="h-96 flex items-center justify-center text-[#64748B] text-[14px]">
        Chargement du dossier adhérent...
      </div>
    );
  }

  const { member, cards, currentSubscription, recentAccessLogs, recentPayments, stats } = dossier;
  const activeCard = cards.find((c) => c.status === "ACTIVE");
  const currentCard = activeCard || cards[0] || null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => router.push("/members")}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux adhérents</span>
        </button>
      </div>

      {/* 1. Header Card (Full width, 96px content) */}
      <Card noPadding>
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Photo / Initials Avatar with click to capture */}
            <div
              onClick={() => setIsPhotoModalOpen(true)}
              className="relative group cursor-pointer shrink-0"
              title="Cliquer pour changer la photo"
            >
              {member.photoUrl ? (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#2563EB] shadow-sm bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.photoUrl}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-[20px] flex items-center justify-center border border-[#BFDBFE]">
                  {member.firstName[0]}
                  {member.lastName[0]}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-[24px] font-bold text-[#0F172A] tracking-tight">
                  {member.firstName} {member.lastName}
                </h2>
                <StatusPill
                  status={
                    currentCard?.status === "BLOCKED"
                      ? "BLOCKED"
                      : currentSubscription?.status || "NO_SUBSCRIPTION"
                  }
                />
              </div>
              <p className="text-[13px] text-[#64748B] mt-1">
                Tél : <span className="font-medium text-[#0F172A]">{member.phone || "—"}</span> · Email :{" "}
                <span className="font-medium text-[#0F172A]">{member.email || "—"}</span> · Inscrit le{" "}
                {formatDate(member.createdAt)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Camera className="w-3.5 h-3.5" />}
              onClick={() => setIsPhotoModalOpen(true)}
            >
              Photo
            </Button>

            <Button
              variant="secondary"
              size="md"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Modifier
            </Button>

            {currentSubscription && (
              <Button
                variant={currentSubscription.storedStatus === "SUSPENDED" ? "secondary" : "danger-soft"}
                size="md"
                leftIcon={
                  currentSubscription.storedStatus === "SUSPENDED" ? (
                    <PlayCircle className="w-4 h-4" />
                  ) : (
                    <PauseCircle className="w-4 h-4" />
                  )
                }
                onClick={() =>
                  handleToggleSubscriptionSuspend(
                    currentSubscription.id,
                    currentSubscription.storedStatus === "SUSPENDED"
                  )
                }
              >
                {currentSubscription.storedStatus === "SUSPENDED" ? "Réactiver" : "Suspendre"}
              </Button>
            )}

            <Button
              variant="primary"
              size="md"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => setIsPaymentModalOpen(true)}
            >
              Renouveler
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Body: 2 Columns (2fr / 1fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2fr) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Abonnement en cours */}
          <Card title="Abonnement en cours">
            {currentSubscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[20px] font-bold text-[#0F172A]">
                      {currentSubscription.planName}
                    </h3>
                    <div className="text-[13px] text-[#64748B] mt-0.5">
                      Tarif standard : {formatMoney(currentSubscription.planPrice)} · {currentSubscription.durationDays} jours
                    </div>
                  </div>
                  <StatusPill status={currentSubscription.status} />
                </div>

                <SubscriptionProgress
                  startDate={currentSubscription.startDate}
                  endDate={currentSubscription.endDate}
                  daysRemaining={currentSubscription.daysRemaining}
                />
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[13px] text-[#64748B]">
                  Cet adhérent ne possède aucun abonnement actif actuellement.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  Souscrire une formule
                </Button>
              </div>
            )}
          </Card>

          {/* Card: Derniers passages */}
          <Card
            title="Derniers passages à la borne"
            subtitle={`${stats.totalPassages} passage(s) au total`}
            noPadding
          >
            {recentAccessLogs.length === 0 ? (
              <div className="p-6 text-center text-[#64748B] text-[13px]">
                Aucun passage enregistré pour cet adhérent
              </div>
            ) : (
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="h-9 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B]">
                    <th className="px-5">Date & Heure</th>
                    <th className="px-4">Borne</th>
                    <th className="px-4">Motif</th>
                    <th className="px-5 text-right">Décision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {recentAccessLogs.map((log) => (
                    <tr key={log.id} className="h-10 hover:bg-[#F8FAFC]">
                      <td className="px-5 font-medium text-[#0F172A] nums">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 text-[#64748B]">{log.kioskName}</td>
                      <td className="px-4 text-[#64748B]">{log.reason}</td>
                      <td className="px-5 text-right">
                        <StatusPill status={log.decision} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Card: Règlements & Reçus */}
          <Card
            title="Historique des règlements"
            subtitle={`Total réglé : ${formatMoney(stats.totalSpent)}`}
            noPadding
          >
            {recentPayments.length === 0 ? (
              <div className="p-6 text-center text-[#64748B] text-[13px]">
                Aucun règlement enregistré
              </div>
            ) : (
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="h-9 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B]">
                    <th className="px-5">N° Reçu</th>
                    <th className="px-4">Date</th>
                    <th className="px-4">Formule</th>
                    <th className="px-4 text-right">Montant</th>
                    <th className="px-5 text-right">Reçu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="h-11 hover:bg-[#F8FAFC]">
                      <td className="px-5 font-mono-code font-semibold text-[#0F172A]">
                        {p.receiptNumber}
                      </td>
                      <td className="px-4 text-[#64748B]">{formatDate(p.createdAt)}</td>
                      <td className="px-4 font-medium text-[#0F172A]">{p.planName}</td>
                      <td className="px-4 text-right font-bold nums">
                        {formatMoney(p.amount)}
                      </td>
                      <td className="px-5 text-right">
                        <button
                          onClick={() => handleReprint(p.id)}
                          title="Voir / Réimprimer le reçu"
                          className="w-7 h-7 inline-flex items-center justify-center rounded hover:bg-[#EFF6FF] text-[#2563EB] transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Side Column (1fr) */}
        <div className="space-y-6">
          {/* Card: Badge RFID Virtuel */}
          <Card title="Badge RFID associé">
            <div className="flex flex-col items-center">
              {currentCard ? (
                <>
                  <BadgeRFID
                    memberName={`${member.firstName} ${member.lastName}`}
                    uid={currentCard.uid}
                    status={currentCard.status}
                  />

                  {/* Card Controls */}
                  <div className="w-full space-y-2 mt-5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      leftIcon={<CreditCard className="w-4 h-4" />}
                      onClick={() => setIsCardModalOpen(true)}
                    >
                      Remplacer le badge
                    </Button>

                    <Button
                      variant={currentCard.status === "BLOCKED" ? "secondary" : "danger-soft"}
                      size="sm"
                      className="w-full"
                      leftIcon={currentCard.status === "BLOCKED" ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      onClick={() => handleToggleCardBlock(currentCard.uid, currentCard.status)}
                    >
                      {currentCard.status === "BLOCKED" ? "Débloquer le badge" : "Bloquer le badge"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 w-full">
                  <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <p className="text-[13px] text-[#64748B] mb-4">
                    Aucun badge RFID n'est actuellement assigné à cet adhérent.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsCardModalOpen(true)}
                  >
                    Attribuer un badge
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Card: Notes internes */}
          <Card title="Notes internes">
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Saisissez des notes sur l'adhérent (sauvegarde automatique au clic hors du champ)..."
              rows={4}
              className="w-full p-3 text-[13px] bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-[6px] focus:border-[#2563EB] focus:bg-white transition-colors"
            />
            <p className="text-[11px] text-[#94A3B8] mt-1.5">
              Ces notes sont strictement confidentielles et ne figurent jamais sur les reçus.
            </p>
          </Card>

          {/* Danger Zone: Soft delete */}
          <div className="p-5 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2]/50">
            <h4 className="text-[13px] font-semibold text-[#DC2626] mb-1">
              Suppression du dossier
            </h4>
            <p className="text-[12px] text-[#64748B] mb-3">
              L'adhérent sera désactivé des listes. Tous les reçus et logs d'accès restent conservés pour l'audit.
            </p>
            <Button
              variant="danger-soft"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Archiver l'adhérent
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Member Modal */}
      <MemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchDossier}
        initialMember={member}
      />

      {/* Payment & Renewal Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preselectedMember={member}
        onPaymentSuccess={(payId) => {
          fetchDossier();
          fetch(`/api/payments/${payId}`)
            .then((r) => r.json())
            .then((d) => setReceiptData(d));
        }}
      />

      {/* Card Assignment Modal */}
      <CardAssignModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        memberId={member.id}
        memberName={`${member.firstName} ${member.lastName}`}
        currentCardUid={currentCard?.uid}
        onSuccess={fetchDossier}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        receiptData={receiptData}
      />

      {/* Webcam Photo Modal */}
      <WebcamCaptureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        memberName={`${member.firstName} ${member.lastName}`}
        onSuccess={handleSavePhoto}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer l'archivage"
        description="Cette action désactivera l'adhérent du club."
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteMember}>
              Confirmer l'archivage
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-[#475569]">
          Êtes-vous certain de vouloir archiver le dossier de{" "}
          <strong>
            {member.firstName} {member.lastName}
          </strong>{" "}
          ? Son badge ne sera plus reconnu au contrôle d'accès.
        </p>
      </Modal>
    </div>
  );
}
