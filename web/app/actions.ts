"use server";

import { revalidatePath } from "next/cache";

export async function refreshArbitrageData() {
  revalidatePath("/arbitrage");
  revalidatePath("/");
}
