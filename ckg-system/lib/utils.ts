import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDate: Date | string | null): number | null {
  if (!birthDate) return null
  const dob = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

export function formatTanggalIndo(date: Date | string | null): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function validateNIK(nik: string): boolean {
  return /^\d{16}$/.test(nik)
}

export function validateNISN(nisn: string): boolean {
  return /^\d{10}$/.test(nisn)
}

/** Tentukan rentang kelas untuk filter target_kelas pertanyaan skrining (lihat skema kondisi_tampil) */
export function getKelasGroup(kelas: string): '1' | '1-3' | '4-6' {
  const n = parseInt(kelas, 10)
  if (n === 1) return '1'
  if (n >= 2 && n <= 3) return '1-3'
  return '4-6'
}
