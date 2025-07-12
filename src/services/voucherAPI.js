import { api } from './baseApi.js';

export const voucherAPI = {
  // Get all vouchers
  getAllVouchers: async () => {
    const response = await api.get('/vouchers?select=*,users!vouchers_created_by_fkey(username)&order=created_at.desc');
    return response.data;
  },

  // Get active vouchers only
  getActiveVouchers: async () => {
    const now = new Date().toISOString();
    const response = await api.get(
      `/vouchers?status=eq.true&tanggal_mulai=lte.${now}&tanggal_berakhir=gte.${now}&select=*&order=created_at.desc`
    );
    return response.data;
  },

  // Get voucher by code (for validation)
  getVoucherByCode: async (kodeVoucher) => {
    const response = await api.get(`/vouchers?kode_voucher=eq.${kodeVoucher}&select=*`);
    return response.data[0];
  },

  // Create new voucher
  createVoucher: async (voucherData) => {
    const response = await api.post('/vouchers', {
      kode_voucher: voucherData.kode_voucher,
      nama_voucher: voucherData.nama_voucher,
      deskripsi: voucherData.deskripsi,
      tipe_diskon: voucherData.tipe_diskon,
      nilai_diskon: parseFloat(voucherData.nilai_diskon),
      minimal_pembelian: parseFloat(voucherData.minimal_pembelian || 0),
      maksimal_diskon: voucherData.maksimal_diskon ? parseFloat(voucherData.maksimal_diskon) : null,
      maksimal_penggunaan: parseInt(voucherData.maksimal_penggunaan),
      tanggal_mulai: voucherData.tanggal_mulai,
      tanggal_berakhir: voucherData.tanggal_berakhir,
      status: voucherData.status !== undefined ? voucherData.status : true,
      created_by: voucherData.created_by
    });
    return response.data[0];
  },

  // Update voucher
  updateVoucher: async (voucherId, voucherData) => {
    const response = await api.patch(`/vouchers?id=eq.${voucherId}`, {
      kode_voucher: voucherData.kode_voucher,
      nama_voucher: voucherData.nama_voucher,
      deskripsi: voucherData.deskripsi,
      tipe_diskon: voucherData.tipe_diskon,
      nilai_diskon: parseFloat(voucherData.nilai_diskon),
      minimal_pembelian: parseFloat(voucherData.minimal_pembelian || 0),
      maksimal_diskon: voucherData.maksimal_diskon ? parseFloat(voucherData.maksimal_diskon) : null,
      maksimal_penggunaan: parseInt(voucherData.maksimal_penggunaan),
      tanggal_mulai: voucherData.tanggal_mulai,
      tanggal_berakhir: voucherData.tanggal_berakhir,
      status: voucherData.status,
      updated_at: new Date().toISOString()
    });
    return response.data[0];
  },

  // Delete voucher
  deleteVoucher: async (voucherId) => {
    // Check if voucher has been used
    const usageCheck = await api.get(`/voucher_usage?voucher_id=eq.${voucherId}&select=id`);
    if (usageCheck.data.length > 0) {
      throw new Error('Tidak dapat menghapus voucher yang sudah pernah digunakan');
    }
    
    await api.delete(`/vouchers?id=eq.${voucherId}`);
  },

  // Toggle voucher status
  toggleVoucherStatus: async (voucherId, status) => {
    const response = await api.patch(`/vouchers?id=eq.${voucherId}`, {
      status: status,
      updated_at: new Date().toISOString()
    });
    return response.data[0];
  },

  // Validate voucher for use
  validateVoucher: async (kodeVoucher, totalBelanja, userId) => {
    const voucher = await voucherAPI.getVoucherByCode(kodeVoucher);
    
    if (!voucher) {
      throw new Error('Kode voucher tidak ditemukan');
    }

    const now = new Date();
    const tanggalMulai = new Date(voucher.tanggal_mulai);
    const tanggalBerakhir = new Date(voucher.tanggal_berakhir);

    // Check if voucher is active
    if (!voucher.status) {
      throw new Error('Voucher tidak aktif');
    }

    // Check date validity
    if (now < tanggalMulai || now > tanggalBerakhir) {
      throw new Error('Voucher sudah tidak berlaku');
    }

    // Check usage limit
    if (voucher.jumlah_terpakai >= voucher.maksimal_penggunaan) {
      throw new Error('Voucher sudah mencapai batas maksimal penggunaan');
    }

    // Check minimum purchase
    if (totalBelanja < voucher.minimal_pembelian) {
      throw new Error(`Minimal pembelian untuk voucher ini adalah Rp ${voucher.minimal_pembelian.toLocaleString('id-ID')}`);
    }

    // Check if user has used this voucher before (optional business rule)
    const userUsage = await api.get(`/voucher_usage?voucher_id=eq.${voucher.id}&user_id=eq.${userId}&select=id`);
    if (userUsage.data.length > 0) {
      throw new Error('Anda sudah pernah menggunakan voucher ini');
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (voucher.tipe_diskon === 'PERCENTAGE') {
      discountAmount = (totalBelanja * voucher.nilai_diskon) / 100;
      if (voucher.maksimal_diskon && discountAmount > voucher.maksimal_diskon) {
        discountAmount = voucher.maksimal_diskon;
      }
    } else if (voucher.tipe_diskon === 'FIXED') {
      discountAmount = voucher.nilai_diskon;
    }

    return {
      voucher,
      discountAmount,
      finalAmount: totalBelanja - discountAmount
    };
  },

  // Apply voucher (record usage)
  applyVoucher: async (voucherId, userId, orderId, discountAmount) => {
    try {
      // Record voucher usage
      const usageResponse = await api.post('/voucher_usage', {
        voucher_id: voucherId,
        user_id: userId,
        order_id: orderId,
        nilai_diskon_digunakan: discountAmount
      });

      // Update voucher usage count
      const currentVoucher = await api.get(`/vouchers?id=eq.${voucherId}&select=jumlah_terpakai`);
      const newCount = currentVoucher.data[0].jumlah_terpakai + 1;
      
      await api.patch(`/vouchers?id=eq.${voucherId}`, {
        jumlah_terpakai: newCount,
        updated_at: new Date().toISOString()
      });

      return usageResponse.data[0];
    } catch (error) {
      console.error('Error applying voucher:', error);
      throw error;
    }
  },

  // Get voucher usage history
  getVoucherUsage: async (voucherId = null) => {
    let query = '/voucher_usage?select=*,vouchers(kode_voucher,nama_voucher),users(username),orders(id)&order=tanggal_digunakan.desc';
    
    if (voucherId) {
      query = `/voucher_usage?voucher_id=eq.${voucherId}&select=*,vouchers(kode_voucher,nama_voucher),users(username),orders(id)&order=tanggal_digunakan.desc`;
    }
    
    const response = await api.get(query);
    return response.data;
  },

  // Get voucher statistics
  getVoucherStats: async () => {
    const allVouchers = await api.get('/vouchers?select=*');
    const activeVouchers = await api.get('/vouchers?status=eq.true&select=*');
    const totalUsage = await api.get('/voucher_usage?select=nilai_diskon_digunakan');
    
    const totalDiscountGiven = totalUsage.data.reduce((sum, usage) => 
      sum + parseFloat(usage.nilai_diskon_digunakan), 0
    );

    return {
      totalVouchers: allVouchers.data.length,
      activeVouchers: activeVouchers.data.length,
      totalUsage: totalUsage.data.length,
      totalDiscountGiven
    };
  }
};