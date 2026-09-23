import React from 'react';

export default function HowToOrder() {
  const steps = [
    {
      num: 1,
      icon: 'fa-list-check',
      title: 'Pilih Akun & Paket',
      desc: 'Pilih akun premium yang kamu butuhkan (Sharing/Private serta durasi langganan).'
    },
    {
      num: 2,
      icon: 'fa-file-invoice-dollar',
      title: 'Isi Data & Pembayaran',
      desc: 'Isi formulir singkat dan pilih metode bayar instan seperti QRIS, DANA, GoPay, atau Bank.'
    },
    {
      num: 3,
      icon: 'fa-whatsapp',
      brand: true,
      title: 'Konfirmasi via WhatsApp',
      desc: 'Klik tombol order otomatis untuk mengirim format pesanan ke admin kami.'
    },
    {
      num: 4,
      icon: 'fa-circle-check',
      title: 'Akun Siap Digunakan',
      desc: 'Data login/invite dikirimkan dalam 1-5 menit lengkap dengan panduan & garansi.'
    }
  ];

  return (
    <section className="how-to-order-section" id="cara-order">
      <div className="container">
        <div className="section-title text-center">
          <span className="subheading">
            <i className="fa-solid fa-route"></i> MUDAH & CEPAT
          </span>
          <h2>4 Langkah Mudah Berbelanja</h2>
          <p>Tidak butuh waktu lama untuk mulai menikmati fitur premium tanpa batas.</p>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.num} className="step-card">
              <div className="step-badge">{step.num}</div>
              <div className="step-icon">
                <i className={`${step.brand ? 'fa-brands' : 'fa-solid'} ${step.icon}`}></i>
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
