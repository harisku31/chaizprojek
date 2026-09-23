import React from 'react';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Dimas Pratama',
      role: 'Pelanggan Netflix & Spotify',
      text: 'Gokil cepet banget pelayanannya! Transfer QRIS, 2 menit kemudian akun Netflix udah dikirim dan langsung bisa nonton 4K bareng keluarga. Garansinya beneran aman.'
    },
    {
      name: 'Siti Rahmawati',
      role: 'Freelance Designer',
      text: 'Langganan Canva Pro di sini hemat banyak buat tugas kuliah dan desain freelance. Udah 6 bulan lancar jaya no kendala. Pasti bakal repurchase terus di sini.'
    },
    {
      name: 'Fajar Kurniawan',
      role: 'Software Engineer',
      text: 'Gemini Advanced AI nya mantap banget, kencang buat bantu kerjaan koding dan riset. Adminnya juga ramah ditanya-tanya malam-malam tetep dibales gercep. Recommended seller JB akun!'
    }
  ];

  return (
    <section className="testimonials-section" id="testimoni">
      <div className="container">
        <div className="section-title text-center">
          <span className="subheading">
            <i className="fa-solid fa-star text-warning"></i> KATA MEREKA
          </span>
          <h2>Testimoni Pelanggan Setia</h2>
          <p>Kepuasan pelanggan adalah prioritas utama ChaizStore.</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testi, i) => (
            <div key={i} className="testi-card">
              <div className="testi-stars">
                {[...Array(5)].map((_, s) => (
                  <i key={s} className="fa-solid fa-star"></i>
                ))}
              </div>
              <p className="testi-text">"{testi.text}"</p>
              <div className="testi-author">
                <div className="author-avatar">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div>
                  <h4>{testi.name}</h4>
                  <span>{testi.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
