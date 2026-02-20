// ============ Auth ============
export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

// ============ Employee ============
export interface Employee {
  id: string;
  userId: string;
  position?: string;
  department?: string;
  phone?: string;
  hourlyRate?: number;
  maxWeeklyHours: number;
  isActive: boolean;
  deletedAt?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface CreateEmployeeData {
  email: string;
  password: string;
  name: string;
  role?: string;
  position?: string;
  department?: string;
  phone?: string;
  hourlyRate?: number;
  maxWeeklyHours?: number;
}

export interface UpdateEmployeeData {
  name?: string;
  position?: string;
  department?: string;
  phone?: string;
  hourlyRate?: number;
  maxWeeklyHours?: number;
}

// ============ Shift ============
export interface Shift {
  id: string;
  employeeId: string;
  startTime: string; // ISO UTC
  endTime: string;   // ISO UTC
  status: "DRAFT" | "PUBLISHED" | "ACKNOWLEDGED" | "CANCELLED";
  note?: string;
  employee?: {
    id: string;
    position?: string;
    user: { id: string; name: string; email: string };
  };
}

export interface CreateShiftData {
  employeeId: string;
  startTime: string;
  endTime: string;
  status?: string;
  note?: string;
  forceOverride?: boolean;
}

export interface UpdateShiftData {
  employeeId?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  note?: string;
  forceOverride?: boolean;
}

// ============ Availability ============
export interface AvailabilityBlock {
  id: string;
  employeeId: string;
  type: "UNAVAILABLE" | "PREFER_NOT" | "AVAILABLE_ONLY";
  dayOfWeek: number; // 0=Sun,...,6=Sat
  startTime?: string; // HH:mm
  endTime?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  employee?: {
    id: string;
    user: { id: string; name: string };
  };
}

export interface CreateAvailabilityData {
  employeeId: string;
  type: "UNAVAILABLE" | "PREFER_NOT" | "AVAILABLE_ONLY";
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
}

// ============ Schedule ============
export interface DaySchedule {
  date: string; // YYYY-MM-DD
  shifts: Shift[];
  hasConflict: boolean;
}

export interface EmployeeSchedule {
  employee: Employee;
  days: DaySchedule[];
}

export interface WeeklySchedule {
  weekStart: string;
  weekEnd: string;
  employees: EmployeeSchedule[];
}

// ============ Copy Week ============
export interface CopyWeekData {
  sourceWeekStart: string;
  targetWeekStart: string;
}

// ============ Reports ============
export interface EmployeeReport {
  employeeId: string;
  name: string;
  position?: string;
  shiftCount: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  hourlyRate?: number;
  totalCost: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  employees: EmployeeReport[];
}

// ============ API Error ============
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  path: string;
}
