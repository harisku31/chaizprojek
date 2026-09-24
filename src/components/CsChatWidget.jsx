import React, { useState, useRef, useEffect } from 'react';
import { CS_GEMINI_CONFIG } from '../data/config';
import { formatCsMarkdown, formatRupiah } from '../utils/format';

export default function CsChatWidget({ products, authUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Halo kak! 👋 Selamat datang di **Customer Service ChaizStore**.

Saya asisten AI resmi yang siap membantu kamu 24/7 untuk:
- 🛡️ **Klaim garansi** & penanganan akun bermasalah (revert/hold/logout)
- 🛒 **Panduan cara beli & bayar** via QRIS All Payment
- 📋 **Cek stok & daftar harga** akun premium terlaris
- ❓ **Pertanyaan & konsultasi** aturan pemakaian akun

Ada kendala atau pertanyaan yang bisa saya bantu sekarang?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

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

  const getSystemInstruction = () => {
    const catalog = buildCatalogContext();
    return `Kamu adalah "Customer Service AI Resmi ChaizStore" (Layanan Pelanggan Akun Premium Terpercaya di Indonesia).
Tugas utamamu adalah melayani pembeli dan calon pembeli dengan ramah, santun, responsif, solutif, dan berempati tinggi, terutama mengenai:
1. KOMPLAIN & KENDALA AKUN (Garansi)
2. PERTANYAAN CARA BELI & PEMBAYARAN
3. CEK HARGA & DAFTAR PRODUK AKUN PREMIUM

${authUser ? `[DATA PELANGGAN SAAT INI]
Pelanggan saat ini sedang login dengan:
- Nama: ${authUser.name}
- Email: ${authUser.email}
- Tipe Akun: ${authUser.isGoogle ? 'Google Account Resmi' : authUser.isMember ? 'VIP Member' : 'Akun Tamu'}
Sapa pelanggan dengan akrab dan sopan menggunakan nama "Kak ${authUser.name}".` : ''}

[INFORMASI PENTING TOKO CHAIZSTORE]
- Nama Toko: ChaizStore
- CS / WhatsApp Admin Resmi: 087795172347 (https://wa.me/6287795172347)
- Metode Pembayaran: QRIS Otomatis All Payment (Mendukung BCA, Mandiri, BRI, BNI, BSI, CIMB, GoPay, OVO, DANA, ShopeePay, LinkAja, dll).
- Pengiriman Akun: Kilat 1 - 5 menit via WhatsApp setelah pembayaran diverifikasi.

[KEBIJAKAN GARANSI & PENANGANAN KOMPLAIN]
- Full Garansi: Semua akun bergaransi penuh selama durasi pembelian.
- Kendala yang Dilindungi: Akun revert/turun ke free, kena hold, logout tiba-tiba, atau password tidak bisa digunakan.
- Prosedur Klaim Garansi:
  1. Pembeli cukup menyiapkan invoice/nama produk dan screenshot bukti error/kendala.
  2. Kirimkan langsung ke WhatsApp Admin di 087795172347 (https://wa.me/6287795172347).
  3. Admin akan segera mengganti dengan akun baru secepatnya (proses 1-10 menit).
- Syarat Garansi Tetap Berlaku: Pembeli dilarang mengubah email/password akun sharing atau mengutak-atik profil pengguna lain.

[KATALOG PRODUK & HARGA SAAT INI]
${catalog}

[CARA MEMBELI]
1. Pilih produk akun di katalog web ChaizStore.
2. Klik tombol "Beli Sekarang", tentukan durasi dan varian.
3. Masukkan Nama & Nomor WhatsApp pembeli.
4. Scan QRIS dan lakukan pembayaran.
5. Konfirmasi bukti ke WhatsApp Admin (087795172347), akun langsung dikirim.

[GAYA BAHASA & FORMAT JAWABAN]
- Gunakan Bahasa Indonesia yang ramah dan hangat (gunakan sapaan "Kak" atau "Kakak").
- Tunjukkan empati tinggi jika user sedang komplain (contoh: "Mohon maaf sekali atas kendala yang dialami ya kak, tenang saja akun di ChaizStore bergaransi penuh 100%...").
- Gunakan format markdown rapi (teks tebal, bullet list point, emoji) agar mudah dibaca di smartphone.
- Jika ada hal teknis yang memerlukan pergantian akun langsung oleh admin manusia, sertakan link WhatsApp Admin: https://wa.me/6287795172347.`;
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
      ...conversationHistory.slice(-10),
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
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    };

    let replyText = null;

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

    setIsGenerating(false);

    if (replyText) {
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: replyText }] }
      ]);
      setMessages((prev) => [...prev, { sender: 'bot', text: replyText }]);
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
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatCsMarkdown(msg.text)
                      }}
                    />
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
                <button
                  type="button"
                  className="cs-chip"
                  onClick={() =>
                    sendMessage('Berapa lama proses pengiriman akun setelah pembayaran?')
                  }
                >
                  ⚡ Waktu Pengiriman Akun
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
