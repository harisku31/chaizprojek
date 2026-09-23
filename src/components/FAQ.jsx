import React, { useState } from 'react';

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(0);

  const faqs = [
    {
      q: 'Apa perbedaan akun Sharing dan Akun Private?',
      a: (
        <>
          <strong>Akun Sharing:</strong> 1 akun dipakai bersama pembeli lain dengan profile terpisah sesuai slot yang kamu sewa. Harganya jauh lebih murah dan dilarang mengubah password/email akun.<br /><br />
          <strong>Akun Private:</strong> Akun khusus milik kamu sendiri (1 akun full atau invite via email pribadi). Kamu bebas mengelola dan tidak ada campur tangan pengguna lain.
        </>
      )
    },
    {
      q: 'Bagaimana dengan sistem garansinya?',
      a: (
        <>
          Semua produk memiliki <strong>Full Garansi</strong> selama durasi pembelian! Jika akun tiba-tiba revert/hold sebelum masa aktif selesai dan mematuhi rules toko, kamu cukup chat admin dengan menyertakan screenshot kendala, dan admin akan mengganti akun baru secepatnya.
        </>
      )
    },
    {
      q: 'Berapa lama proses setelah saya transfer?',
      a: (
        <>
          Rata-rata proses hanya memakan waktu <strong>1 hingga 5 menit</strong> setelah bukti pembayaran dikonfirmasi oleh admin (pada jam operasional normal).
        </>
      )
    },
    {
      q: 'Metode pembayaran apa saja yang tersedia?',
      a: (
        <>
          Kami menerima <strong>QRIS</strong> (Bisa scan dari semua bank seperti BCA, Mandiri, BRI, BNI, BSI serta e-wallet DANA, GoPay, OVO, ShopeePay, LinkAja) tanpa ribet dan bebas biaya admin tinggi.
        </>
      )
    },
    {
      q: 'Apakah akun ini legal dan aman?',
      a: (
        <>
          Ya, semua akun dibeli melalui metode pembayaran resmi (Credit Card / Gift Card / Region Official) sehingga aman digunakan di device kamu tanpa risiko banned perangkat.
        </>
      )
    }
  ];

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? -1 : index);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="container">
        <div className="section-title text-center">
          <span className="subheading">
            <i className="fa-solid fa-circle-question"></i> PERTANYAAN UMUM
          </span>
          <h2>Frequently Asked Questions</h2>
          <p>Pertanyaan yang sering ditanyakan seputar pembelian akun premium di ChaizStore.</p>
        </div>

        <div className="faq-accordion">
          {faqs.map((faq, index) => {
            const isActive = activeIndex === index;
            return (
              <div key={index} className={`faq-item ${isActive ? 'active' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.q}</span>
                  <i className="fa-solid fa-chevron-down"></i>
                </button>
                {isActive && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
