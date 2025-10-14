import prisma from "@/lib/prisma";

export async function applyRiderPenalty(riderId: string, reason: string) {
  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider) return;

  let newScore = Math.max(rider.reliabilityScore - 10, 0);
  let newPenaltyCount = rider.penaltyCount + 1;
  let suspensionUntil: Date | null = null;

  // 🚫 Temporary suspension rules
  if (newPenaltyCount >= 3 && newPenaltyCount < 5) {
    suspensionUntil = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours
  } else if (newPenaltyCount >= 5) {
    suspensionUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }

  await prisma.rider.update({
    where: { id: riderId },
    data: {
      reliabilityScore: newScore,
      penaltyCount: newPenaltyCount,
      suspensionUntil,
    },
  });

  console.log(
    `[Penalty] Rider ${riderId} penalized for "${reason}". Score=${newScore}, Penalties=${newPenaltyCount}`
  );
}
