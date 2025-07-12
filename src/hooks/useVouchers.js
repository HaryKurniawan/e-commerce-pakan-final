// hooks/useVouchers.js
import { useState, useEffect } from 'react';
import { voucherAPI } from '../services/voucherAPI';

export const useVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all vouchers
  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await voucherAPI.getAllVouchers();
      setVouchers(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active vouchers only
  const fetchActiveVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await voucherAPI.getActiveVouchers();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching active vouchers:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create voucher
  const createVoucher = async (voucherData) => {
    try {
      setLoading(true);
      setError(null);
      const newVoucher = await voucherAPI.createVoucher(voucherData);
      setVouchers(prev => [newVoucher, ...prev]);
      return newVoucher;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update voucher
  const updateVoucher = async (voucherId, voucherData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedVoucher = await voucherAPI.updateVoucher(voucherId, voucherData);
      setVouchers(prev => prev.map(v => v.id === voucherId ? updatedVoucher : v));
      return updatedVoucher;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete voucher
  const deleteVoucher = async (voucherId) => {
    try {
      setLoading(true);
      setError(null);
      await voucherAPI.deleteVoucher(voucherId);
      setVouchers(prev => prev.filter(v => v.id !== voucherId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Toggle voucher status
  const toggleVoucherStatus = async (voucherId, status) => {
    try {
      setLoading(true);
      setError(null);
      const updatedVoucher = await voucherAPI.toggleVoucherStatus(voucherId, status);
      setVouchers(prev => prev.map(v => v.id === voucherId ? { ...v, status } : v));
      return updatedVoucher;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Validate voucher for use
  const validateVoucher = async (kodeVoucher, totalBelanja, userId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await voucherAPI.validateVoucher(kodeVoucher, totalBelanja, userId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Apply voucher
  const applyVoucher = async (voucherId, userId, orderId, discountAmount) => {
    try {
      setLoading(true);
      setError(null);
      const result = await voucherAPI.applyVoucher(voucherId, userId, orderId, discountAmount);
      // Update voucher usage count in local state
      setVouchers(prev => prev.map(v => 
        v.id === voucherId 
          ? { ...v, jumlah_terpakai: v.jumlah_terpakai + 1 }
          : v
      ));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get voucher usage
  const getVoucherUsage = async (voucherId = null) => {
    try {
      setLoading(true);
      setError(null);
      const data = await voucherAPI.getVoucherUsage(voucherId);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching voucher usage:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get voucher statistics
  const getVoucherStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await voucherAPI.getVoucherStats();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching voucher stats:', err);
      return {};
    } finally {
      setLoading(false);
    }
  };

  // Get voucher by code
  const getVoucherByCode = async (kodeVoucher) => {
    try {
      setLoading(true);
      setError(null);
      const voucher = await voucherAPI.getVoucherByCode(kodeVoucher);
      return voucher;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const isVoucherActive = (voucher) => {
    const now = new Date();
    const start = new Date(voucher.tanggal_mulai);
    const end = new Date(voucher.tanggal_berakhir);
    return voucher.status && now >= start && now <= end;
  };

  const isVoucherAvailable = (voucher) => {
    return isVoucherActive(voucher) && voucher.jumlah_terpakai < voucher.maksimal_penggunaan;
  };

  const calculateDiscount = (voucher, totalBelanja) => {
    if (!voucher || totalBelanja < voucher.minimal_pembelian) {
      return 0;
    }

    let discountAmount = 0;
    if (voucher.tipe_diskon === 'PERCENTAGE') {
      discountAmount = (totalBelanja * voucher.nilai_diskon) / 100;
      if (voucher.maksimal_diskon && discountAmount > voucher.maksimal_diskon) {
        discountAmount = voucher.maksimal_diskon;
      }
    } else if (voucher.tipe_diskon === 'FIXED') {
      discountAmount = voucher.nilai_diskon;
    }

    return Math.min(discountAmount, totalBelanja);
  };

  // Auto fetch on mount
  useEffect(() => {
    fetchVouchers();
  }, []);

  return {
    vouchers,
    loading,
    error,
    fetchVouchers,
    fetchActiveVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    toggleVoucherStatus,
    validateVoucher,
    applyVoucher,
    getVoucherUsage,
    getVoucherStats,
    getVoucherByCode,
    isVoucherActive,
    isVoucherAvailable,
    calculateDiscount
  };
};