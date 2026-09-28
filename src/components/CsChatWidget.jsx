import React, { useState, useRef, useEffect } from 'react';
import { CS_GEMINI_CONFIG, FORMSPREE_CONFIG } from '../data/config';
import { formatCsMarkdown, formatRupiah } from '../utils/format';

export default function CsChatWidget({ products, authUser, cartItems = [], onShowToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Halo${authUser?.name ? ` Kak **${authUser.name}**` : ' kak'}! 👋 Selamat datang di **ChaizStore**.

Aku ChaizBot, asisten AI resmi yang siap nemenin dan bantu kamu 24/7. Mau tanya rekomendasi akun premium, cek harga, cek keranjang belanja, kirim kritik & saran, atau tanya seputar garansi? Langsung ketik di sini ya!`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Send feedback/critique/suggestion automatically to Formspree (Admin Gmail)
  const sendFeedbackToFormspree = async ({ category, userMessage, aiResponse }) => {
    try {
      const payload = {
        _subject: `[ChaizStore] Masukan Pelanggan: ${category} dari ${authUser?.name || 'Pengguna'}`,
        nama: authUser?.name || 'Pengguna ChaizStore',
        email: authUser?.email || 'tidak_ada_email@chaizstore.id',
        kategori: category || 'Kritik & Saran',
        pesan_pelanggan: userMessage,
        respon_ai: aiResponse || '',
        tanggal: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        halaman_web: typeof window !== 'undefined' ? window.location.href : 'ChaizStore'
      };

      const res = await fetch(FORMSPREE_CONFIG.feedbackEndpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (onShowToast) {
          onShowToast('Kritik & saran kamu berhasil terkirim ke Gmail Admin!', 'fa-paper-plane text-success');
        }
      }
    } catch (err) {
      console.warn('Gagal mengirim ke Formspree:', err);
    }
  };

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isGenerating]);

  // Build catalog context for AI
  const buildCatalogContext = () => {
    return products
      .map((p) => {
        const durList = (p.durations || [])
          .map(
            (d) =>
              `${d.name}: ${formatRupiah(d.price)} (garansi: ${d.warranty || p.warranty})`
          )
          .join(', ');
        return `- ${p.name} [Kategori: ${p.category}] | Harga mulai: ${formatRupiah(
          p.currentPrice || 0
        )} | Pilihan durasi: [${durList}] | Stok: ${
          p.stock > 0 ? 'Tersedia (' + p.stock + ')' : 'Kosong'
        }.`;
      })
      .join('\n');
  };

  // Build user cart context for AI (Akses Terbatas: Hanya isi keranjang belanja user saat ini)
  const buildCartContext = () => {
    if (!cartItems || cartItems.length === 0) {
      return 'Keranjang belanja user saat ini masih KOSONG (0 item).';
    }
    const total = cartItems.reduce((acc, it) => acc + (it.price || 0), 0);
    const itemsList = cartItems
      .map(
        (it, idx) =>
          `${idx + 1}. **${it.productName}** | Pilihan Paket: ${it.durationName} (${it.viaType || 'Reguler'}) | Harga: ${formatRupiah(it.price || 0)}`
      )
      .join('\n');
    return `User saat ini memiliki ${cartItems.length} item di dalam keranjang belanja:\n${itemsList}\nTotal Belanja di Keranjang: ${formatRupiah(total)}`;
  };

  const getSystemInstruction = () => {
    const catalog = buildCatalogContext();
    const cartContext = buildCartContext();
    const isFirstTurn = conversationHistory.length === 0;

    return `Kamu adalah "ChaizBot" - Asisten Customer Service AI Resmi ChaizStore (Layanan Akun Premium Terpercaya di Indonesia).
Kamu memiliki kepribadian yang asik diajak ngobrol, ramah, santai, cerdas, solutif, dan luwes layaknya customer service manusia sungguhan atau teman ngobrol (conversational bot).

[1. BISA DIAJAK NGOBROL SANTAI & NATURAL (TIDAK KAKU)]
- Bersikaplah seperti teman atau customer service manusia yang asik, ramah, dan cerdas.
- Kamu BISA DIAJAK NGOBROL santai tentang apa saja: rekomendasi tontonan film/series (Netflix, Viu, Disney+), anime seru (Bstation), musik (Spotify), desain grafis (Canva), editing video (CapCut), atau sekadar curhat dan ngobrol santai seputar aktivitas user.
- Bahasa: Gunakan bahasa Indonesia kasual-profesional yang santai ("kamu/aku" atau panggil "kak/kamu"). Jangan kaku seperti robot template atau bot FAQ statis.
- Mengalir alami: Tanggapi obrolan user dengan antusias, hangat, dan nyambung. Jangan memberikan balasan yang terasa kaku atau formal berlebihan.

[2. ATURAN PENYEBUTAN NAMA & GMAIL/EMAIL (SANGAT KETAT!)]
- JANGAN PERNAH mengulang-ulang sapaan "Hai Kak [Nama]" atau menyebut nama user di SETIAP pesan balasan!
${authUser ? `  * Nama user adalah "${authUser.name}". ${isFirstTurn ? 'Karena ini awal percakapan, kamu boleh menyapa namanya MAKSIMAL SEKALI saja (misal: "Halo Kak ' + authUser.name + '...").' : 'Karena percakapan sudah berjalan, JANGAN sebut nama lagi di awal pesan. Langsung jawab ke inti topik!'}` : ''}
- JANGAN PERNAH menyebutkan, mengumbar, atau mencantumkan alamat email/Gmail user (seperti "...@gmail.com") di dalam percakapan! Kecuali jika user sendiri yang secara spesifik bertanya "Email akun saya apa?".
- Pada balasan-balasan berikutnya, LANGSUNG jawab ke inti topik pembicaraan tanpa basa-basi salam pembuka berulang-ulang.

[3. AKSES TERBATAS: CEK KERANJANG BELANJA USER (HANYA INI YANG DIAKSES)]
- Kamu DIBERIKAN AKSES TERBATAS HANYA untuk melihat isi keranjang belanja user saat ini. Kamu TIDAK memiliki akses ke aktivitas lain atau data pribadi lainnya.
[STATUS KERANJANG BELANJA USER SAAT INI]
${cartContext}
- Aturan saat user bertanya tentang keranjang belanjanya:
  * Jika user bertanya (misal: "aku lagi pesan apa aja?", "cek keranjangku dong", "ada apa di keranjangku?", "total belanjaanku berapa?", dll), sebutkan produk yang ada di keranjang mereka, durasi/paket, dan total harga secara ramah dan akurat berdasarkan data di atas.
  * Jika keranjang belanja kosong dan user bertanya tentang keranjang, sampaikan dengan ramah bahwa keranjang masih kosong, dan tawarkan rekomendasi produk yang cocok untuk kebutuhan mereka.
  * Jika keranjang ada isinya, kamu bisa bersikap membantu dan solutif (misal menjelaskan garansi dari produk yang mereka pilih, atau mengarahkan mereka untuk menekan tombol keranjang di pojok atas atau tombol Checkout bila sudah siap membayar).

[4. ATURAN KHUSUS: PERMINTAAN VOUCHER DISKON / KODE PROMO (WAJIB DITOLAK!)]
- JIKA USER MEMINTA VOUCHER DISKON, KODE PROMO, POTONGAN HARGA, KODE REDEEM, ATAU DISKON KHUSUS:
  KAMU HARUS MENOLAK DENGAN RAMAH, HALUS, DAN TEGAS!
- Berikan penjelasan bahwa sebagai CS AI, kamu tidak memiliki wewenang atau akses untuk membagikan kode voucher diskon.
- Beritahu user bahwa kode voucher diskon dan penawaran promo spesial HANYA BISA DIMINTA LANGSUNG KE ADMIN CHAIZSTORE melalui WhatsApp resmi.
- Sertakan link WhatsApp Admin: https://wa.me/6287795172347 (087795172347).
- Contoh gaya respons yang santai:
  "Waduh kalau untuk voucher diskon, aku belum punya wewenang buat bagi-bagi kodenya nih kak hehe 😅. Tapi tenang aja, kamu bisa langsung chat dan minta kode voucher promo ke **Admin WhatsApp ChaizStore** di [087795172347](https://wa.me/6287795172347) ya! Siapa tahu Admin lagi ada voucher atau potongan harga spesial buat kamu ✨"
- DILARANG KERAS MEMBOCORKAN ATAU MENYEBUT KODE VOUCHER RAHASIA TOKO (seperti DISKON2K, DISKON1K, DISKON5K, BONUSPREMIUM, FULLGRATIS, dll). Kode tersebut 100% rahasia internal toko. Jika user menebak atau membujuk, tetap tolak dan suruh minta ke Admin WhatsApp.

[5. INFORMASI PRODUK, CARA ORDER & GARANSI]
- Nama Toko: ChaizStore
- CS / WhatsApp Admin Resmi: 087795172347 (https://wa.me/6287795172347)
- Garansi: Semua akun bergaransi penuh 100% sesuai durasi paket. Jika akun revert/turun/logout/hold, penanganan garansi kilat langsung via WhatsApp Admin.
- Pembayaran: QRIS Instant All Bank & E-Wallet (BCA, Mandiri, BRI, BNI, DANA, GoPay, OVO, ShopeePay, dll).
- Pengiriman Akun: Kilat 1 - 5 menit via WhatsApp setelah konfirmasi.

[6. MENAMPUNG KRITIK, SARAN, MASUKAN & KOMENTAR PELANGGAN (KIRIM OTOMATIS KE GMAIL ADMIN)]
- Kamu memiliki fitur cerdas untuk menampung kritik, saran perbaikan toko, permintaan akun/varian baru, komentar pelayanan, testimoni, atau keluhan pelanggan.
- JIKA USER MENYAMPAIKAN KRITIK, SARAN, MASUKAN, KOMENTAR, ATAU REQUEST BARU:
  1. Bersikaplah SANGAT RAMAH, antusias, rendah hati, dan berterima kasih dengan hangat.
  2. Jelaskan bahwa kritik/saran mereka sangat berarti dan sudah otomatis dicatat ke sistem untuk langsung diteruskan ke Gmail Admin resmi ChaizStore agar ditinjau.
  3. DI AKHIR JAWABANMU, WAJIB TULISKAN TAG INI DI BARIS PALING BAWAH (di baris baru sendiri):
     [SUBMIT_FEEDBACK: <Kategori>]
     (Contoh: [SUBMIT_FEEDBACK: Saran Produk], [SUBMIT_FEEDBACK: Kritik Pelayanan], [SUBMIT_FEEDBACK: Masukan Website], atau [SUBMIT_FEEDBACK: Komentar Pelanggan]).

[KATALOG PRODUK & HARGA SAAT INI]
${catalog}

[FORMAT RESPONS]
- Format markdown rapi (teks tebal pada judul/poin penting, bullet points secukupnya, emoji yang pas dan ramah).
- Jangan berikan jawaban dinding teks yang terlalu panjang kecuali jika user meminta penjelasan mendalam.`;
  };

  const sendMessage = async (textToSend) => {
    const text = textToSend.trim();
    if (!text || isGenerating) return;

    setIsOpen(true);
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInputValue('');
    setIsGenerating(true);

    const systemPrompt = getSystemInstruction();
    const requestContents = [
      ...conversationHistory.slice(-16),
      {
        role: 'user',
        parts: [{ text }]
      }
    ];

    const payload = {
      contents: requestContents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 1000
      }
    };

    let replyText = null;

    // 1. Try Vercel Serverless Function first (/api/chat)
    try {
      const serverlessRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (serverlessRes.ok) {
        const data = await serverlessRes.json();
        if (data.reply) {
          replyText = data.reply;
        }
      }
    } catch (err) {
      console.warn('Vercel serverless /api/chat not reachable, trying direct API:', err);
    }

    // 2. Direct Google Gemini API fallback (local dev or direct client)
    if (!replyText) {
      for (const modelName of CS_GEMINI_CONFIG.models) {
        try {
          const url = `${CS_GEMINI_CONFIG.apiEndpoint}/${modelName}:generateContent?key=${CS_GEMINI_CONFIG.apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            if (
              data.candidates &&
              data.candidates[0] &&
              data.candidates[0].content &&
              data.candidates[0].content.parts
            ) {
              replyText = data.candidates[0].content.parts.map((p) => p.text).join('');
              break;
            }
          }
        } catch (err) {
          console.warn(`Failed model ${modelName}:`, err);
        }
      }
    }

    setIsGenerating(false);

    if (replyText) {
      // Check if this response triggered a feedback submission to Formspree
      const feedbackMatch = replyText.match(/\[SUBMIT_FEEDBACK:\s*([^\]]+)\]/i);
      let isFeedback = !!feedbackMatch;
      let feedbackCategory = feedbackMatch ? feedbackMatch[1].trim() : '';

      // Fallback check if user message clearly indicates critique/suggestion/feedback
      const feedbackKeywords = /(kritik|saran|masukan|komplain|keluhan|ulasan|review|komentar|feedback|tolong perbaiki|tolong tambahin|evaluasi)/i;
      if (!isFeedback && feedbackKeywords.test(text)) {
        isFeedback = true;
        feedbackCategory = 'Kritik / Saran Pelanggan';
      }

      // Clean machine tag from displayed reply so user doesn't see raw tag
      const cleanReply = replyText.replace(/\[SUBMIT_FEEDBACK:\s*[^\]]+\]/gi, '').trim();

      if (isFeedback) {
        sendFeedbackToFormspree({
          category: feedbackCategory || 'Kritik & Saran',
          userMessage: text,
          aiResponse: cleanReply
        });
      }

      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: cleanReply }] }
      ]);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: cleanReply, isFeedbackSent: isFeedback }
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Mohon maaf kak, sistem CS AI sedang mengalami sedikit kendala jaringan. Jangan khawatir! Kamu bisa langsung konsultasi garansi atau keluhan ke WhatsApp Admin resmi kami di [087795172347](https://wa.me/6287795172347) ya! 🙏'
        }
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        className={`floating-cs ${isOpen ? 'active' : ''}`}
        id="floatingCsBtn"
        onClick={() => setIsOpen(!isOpen)}
        title="Customer Service AI (Komplain & Tanya Jawab)"
        aria-label="Buka Chat Customer Service AI"
      >
        <div className="cs-btn-pulse"></div>
        <div className="cs-btn-icon-wrap">
          <i className="fa-solid fa-headset cs-icon-headset"></i>
          <i className="fa-solid fa-xmark cs-icon-close"></i>
        </div>
        <span className="cs-badge-text">CS</span>
        <span className="cs-tooltip">CS AI (Komplain & Tanya Jawab)</span>
      </button>

      {/* Chat Widget Window */}
      <div className={`cs-chat-widget ${!isOpen ? 'hidden' : ''}`} aria-hidden={!isOpen}>
        <div className="cs-chat-header">
          <div className="cs-chat-header-info">
            <div className="cs-chat-avatar">
              <i className="fa-solid fa-headset"></i>
              <span className="cs-online-dot"></span>
            </div>
            <div>
              <div className="cs-chat-title-row">
                <h4>CS ChaizStore AI</h4>
                <span className="cs-gemini-badge">
                  <i className="fa-solid fa-wand-magic-sparkles"></i> AI CS
                </span>
              </div>
              <p className="cs-chat-status">
                <span className="cs-pulse-dot"></span> Online 24/7 &bull; Siap Bantu Garansi & Komplain
              </p>
            </div>
          </div>
          <div className="cs-chat-header-actions">
            <a
              href="https://wa.me/6287795172347?text=Halo%20Admin%20ChaizStore,%20saya%20mau%20minta%20bantuan%20CS%20langsung"
              target="_blank"
              rel="noopener noreferrer"
              className="cs-wa-shortcut-btn"
              title="Hubungi WhatsApp Admin"
            >
              <i className="fa-brands fa-whatsapp"></i> <span>Admin WA</span>
            </a>
            <button
              type="button"
              className="cs-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup Chat"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div className="cs-chat-body">
          <div className="cs-chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`cs-message cs-message-${msg.sender}`}>
                {msg.sender === 'bot' && (
                  <div className="cs-msg-avatar">
                    <i className="fa-solid fa-robot"></i>
                  </div>
                )}
                <div className="cs-msg-content">
                  {msg.sender === 'bot' ? (
                    <>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formatCsMarkdown(msg.text)
                        }}
                      />
                      {msg.isFeedbackSent && (
                        <div className="cs-feedback-sent-badge">
                          <i className="fa-solid fa-envelope-circle-check"></i>
                          <span>Masukan ini telah otomatis dikirimkan ke Gmail Admin ChaizStore.</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ margin: 0 }}>{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Quick chips if early in conversation */}
            {messages.length <= 2 && (
              <div className="cs-quick-chips">
                <button
                  type="button"
                  className="cs-chip"
                  onClick={() =>
                    sendMessage('Halo ChaizBot, aku mau kasih kritik dan saran untuk toko ChaizStore...')
                  }
                >
                  💌 Kirim Kritik & Saran
                </button>
                {cartItems.length > 0 ? (
                  <button
                    type="button"
                    className="cs-chip"
                    onClick={() =>
                      sendMessage('Boleh cek apa aja yang lagi ada di keranjang belanjaku dan berapa totalnya?')
                    }
                  >
                    🛒 Cek Keranjang ({cartItems.length} item)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="cs-chip"
                    onClick={() =>
                      sendMessage('Boleh tolong cek keranjang belanjaku?')
                    }
                  >
                    🛒 Cek Keranjang Belanja
                  </button>
                )}
                <button
                  type="button"
                  className="cs-chip"
                  onClick={() =>
                    sendMessage('Boleh rekomendasiin akun premium terbaik buat nonton film atau kerjaan desain?')
                  }
                >
                  🍿 Rekomendasi Akun & Film
                </button>
                <button
                  type="button"
                  className="cs-chip"
                  onClick={() =>
                    sendMessage('Bagaimana cara klaim garansi jika akun saya bermasalah?')
                  }
                >
                  🛡️ Klaim Garansi Akun
                </button>
                <button
                  type="button"
                  className="cs-chip"
                  onClick={() =>
                    sendMessage(
                      'Akun saya tiba-tiba revert atau kena hold, bagaimana solusinya?'
                    )
                  }
                >
                  ⚠️ Akun Revert / Hold
                </button>
                <button
                  type="button"
                  className="cs-chip"
                  onClick={() =>
                    sendMessage('Bagaimana cara order akun premium dan bayar lewat QRIS?')
                  }
                >
                  💳 Cara Order & Bayar
                </button>
                <button
                  type="button"
                  className="cs-chip"
                  onClick={() =>
                    sendMessage(
                      'Akun premium apa saja yang tersedia dan berapa daftar harganya?'
                    )
                  }
                >
                  📋 Daftar Produk & Harga
                </button>
              </div>
            )}

            {/* Typing Indicator */}
            {isGenerating && (
              <div className="cs-typing-indicator" style={{ display: 'flex' }}>
                <div className="cs-msg-avatar">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div className="cs-typing-bubble">
                  <span className="cs-typing-dot"></span>
                  <span className="cs-typing-dot"></span>
                  <span className="cs-typing-dot"></span>
                </div>
                <span className="cs-typing-label">ChaizStore sedang mengetik...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="cs-chat-footer">
          <form
            className="cs-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputValue);
            }}
          >
            <textarea
              ref={inputRef}
              className="cs-chat-textarea"
              placeholder="Ketik pertanyaan atau kendala kamu di sini..."
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="cs-btn-send"
              disabled={isGenerating || !inputValue.trim()}
              aria-label="Kirim Pesan"
              title="Kirim Pesan"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
          <div className="cs-footer-hint">
            <span>Tekan Enter untuk kirim &bull; Customer Service ChaizStore AI</span>
          </div>
        </div>
      </div>
    </>
  );
}
