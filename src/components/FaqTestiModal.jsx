import React, { useState } from 'react';

export default function FaqTestiModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('faq'); // 'faq' | 'testi'
  const [activeFaqIndex, setActiveFaqIndex] = useState(0);

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

  const testimonials = [
    {
      name: 'Dimas Pratama',
      role: 'Pelanggan Netflix & Spotify',
      rating: 5,
      text: 'Gokil cepet banget pelayanannya! Transfer QRIS, 2 menit kemudian akun Netflix udah dikirim dan langsung bisa nonton 4K bareng keluarga. Garansinya beneran aman.'
    },
    {
      name: 'Siti Rahmawati',
      role: 'Freelance Designer',
      rating: 5,
      text: 'Langganan Canva Pro di sini hemat banyak buat tugas kuliah dan desain freelance. Udah 6 bulan lancar jaya no kendala. Pasti bakal repurchase terus di sini.'
    },
    {
      name: 'Fajar Kurniawan',
      role: 'Software Engineer',
      rating: 5,
      text: 'Gemini Advanced AI nya mantap banget, kencang buat bantu kerjaan koding dan riset. Adminnya juga ramah ditanya-tanya malam-malam tetep dibales gercep. Recommended seller JB akun!'
    },
    {
      name: 'Rian Hidayat',
      role: 'Video Editor & Content Creator',
      rating: 5,
      text: 'CapCut Pro dan YouTube Premiumnya super mantap. No watermark, export lancar 4K. Pelayanan ChaizStore memang paling top dan terpercaya!'
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaqIndex(activeFaqIndex === index ? -1 : index);
  };

  return (
    <>
      {/* Tombol Bulat Setting di Atas CS (Mengikuti gaya & bentuk bulat logo CS) */}
      <button
        type="button"
        className={`floating-setting-btn ${isOpen ? 'active' : ''}`}
        id="floatingSettingBtn"
        onClick={() => setIsOpen(!isOpen)}
        title="FAQ & Testimoni"
        aria-label="Buka Menu FAQ & Testimoni"
      >
        <div className="setting-btn-pulse"></div>
        <div className="setting-icon-wrap">
          <i className="fa-solid fa-gear setting-icon-gear"></i>
          <i className="fa-solid fa-xmark setting-icon-close"></i>
        </div>
        <span className="setting-tooltip">FAQ & Testimoni</span>
      </button>

      {/* Modal Popup FAQ & Testimoni */}
      {isOpen && (
        <div className="faq-testi-modal-overlay" style={{ display: 'flex' }}>
          <div
            className="faq-testi-modal-backdrop"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="faq-testi-modal-card">
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsOpen(false)}
              title="Tutup Menu"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Header Modal */}
            <div className="faq-modal-header">
              <span className="faq-modal-badge">
                <i className="fa-solid fa-sparkles text-warning"></i> Pusat Informasi
              </span>
              <h3>FAQ & Testimoni Pembeli</h3>
              <p>Temukan jawaban seputar layanan kami dan ulasan dari pembeli setia.</p>

              {/* Tab Selector */}
              <div className="faq-testi-tab-nav">
                <button
                  type="button"
                  className={`tab-switch-btn ${activeTab === 'faq' ? 'active' : ''}`}
                  onClick={() => setActiveTab('faq')}
                >
                  <i className="fa-solid fa-circle-question"></i> Pertanyaan Umum (FAQ)
                </button>
                <button
                  type="button"
                  className={`tab-switch-btn ${activeTab === 'testi' ? 'active' : ''}`}
                  onClick={() => setActiveTab('testi')}
                >
                  <i className="fa-solid fa-star text-warning"></i> Testimoni Pembeli ({testimonials.length})
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="faq-modal-body">
              {/* TAB 1: FAQ ACCORDION */}
              {activeTab === 'faq' && (
                <div className="faq-modal-content">
                  <div className="faq-accordion-modal">
                    {faqs.map((faq, index) => (
                      <div
                        key={index}
                        className={`faq-item ${activeFaqIndex === index ? 'active' : ''}`}
                      >
                        <button
                          type="button"
                          className="faq-question"
                          onClick={() => toggleFaq(index)}
                          aria-expanded={activeFaqIndex === index}
                        >
                          <span className="faq-q-text">
                            <i className="fa-solid fa-circle-question faq-q-icon"></i>
                            {faq.q}
                          </span>
                          <i className="fa-solid fa-chevron-down faq-chevron"></i>
                        </button>
                        <div className="faq-answer">
                          <p>{faq.a}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="faq-contact-cta">
                    <span>Punya pertanyaan lain yang belum terjawab?</span>
                    <a
                      href="https://wa.me/6287795172347?text=Halo%20Admin%20ChaizStore,%20mau%20tanya%20seputar%20akun%20premium"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-wa-nav"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      <i className="fa-brands fa-whatsapp"></i> Chat Admin CS
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 2: TESTIMONI PEMBELI */}
              {activeTab === 'testi' && (
                <div className="testi-modal-content">
                  <div className="testi-modal-grid">
                    {testimonials.map((testi, i) => (
                      <div key={i} className="testi-card-modal">
                        <div className="testi-stars-row">
                          {[...Array(testi.rating || 5)].map((_, s) => (
                            <i key={s} className="fa-solid fa-star"></i>
                          ))}
                          <span className="verified-buyer-tag">
                            <i className="fa-solid fa-circle-check"></i> Pembeli Terverifikasi
                          </span>
                        </div>
                        <p className="testi-text-modal">"{testi.text}"</p>
                        <div className="testi-user-meta">
                          <div className="testi-avatar-circle">
                            {testi.name.charAt(0)}
                          </div>
                          <div>
                            <h5>{testi.name}</h5>
                            <small>{testi.role}</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
