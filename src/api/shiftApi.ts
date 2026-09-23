import {
  type ActiveShiftResponse,
  
  type ShiftsResponse,
} from "../types/shift";

import { api } from "./client";



export async function getActiveShift() {
  const response = await api.get<ActiveShiftResponse>("/shifts/active");

  return response.data;
}

export async function getMyShifts() {
  const response = await api.get<ShiftsResponse>("/shifts/my");

  return response.data;
}
