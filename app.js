// Elements
const nameInput   = document.getElementById('fullName');
const emailInput  = document.getElementById('email');
const avatarInput = document.getElementById('avatar');
const passTypeSel = document.getElementById('passType');

const namePreview  = document.getElementById('namePreview');
const emailPreview = document.getElementById('emailPreview');
const avatarBox    = document.getElementById('avatarPreview');
const badge        = document.getElementById('badge');

const ticketIdEl = document.getElementById('ticketId');
const seatEl     = document.getElementById('seatNo');
const form       = document.getElementById('ticketForm');
const qrBox      = document.getElementById('qr');
const downloadBtn= document.getElementById('downloadBtn');
const themeBtn   = document.getElementById('themeToggle');
const ticketEl   = document.getElementById('ticket');
const countdownEl= document.getElementById('countdown');

// Share buttons
const shareNative   = document.getElementById('shareNative');
const shareLinkedIn = document.getElementById('shareLinkedIn');
const shareX        = document.getElementById('shareX');
const shareWhatsApp = document.getElementById('shareWhatsApp');
const copyCaption   = document.getElementById('copyCaption');

// Helpers
function makeTicketId(){
  const n = Math.floor(Math.random()*90000)+10000;
  return `ID: CC-${n}`;
}
function makeSeat(){
  const letters = "ABCDEFGH";
  const row = letters[Math.floor(Math.random()*letters.length)];
  const num = String(Math.floor(Math.random()*30)+1).padStart(2,'0');
  return `Seat ${row}-${num}`;
}
function initialsFrom(name){
  if(!name) return "👤";
  const parts = name.trim().split(/\s+/).slice(0,2);
  return parts.map(p=>p[0]?.toUpperCase()||"").join('') || "👤";
}
function updatePreview(){
  namePreview.textContent  = nameInput.value || "Your Name";
  emailPreview.textContent = emailInput.value || "your@email.com";
  if(!avatarInput.files || !avatarInput.files[0]){
    avatarBox.style.backgroundImage = "";
    avatarBox.textContent = initialsFrom(nameInput.value);
  }
}

// Avatar preview (high quality via object URL)
avatarInput.addEventListener('change', () => {
  const file = avatarInput.files?.[0];
  if(file){
    const url = URL.createObjectURL(file);
    avatarBox.style.backgroundImage = `url(${url})`;
    avatarBox.textContent = "";
  } else {
    updatePreview();
  }
});

// QR
function generateQR(content){
  qrBox.innerHTML = "";
  new QRCode(qrBox, {
    text: content,
    width: 140,
    height: 140,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

// Pass-type backgrounds + badge
function applyPassType(pass){
  badge.textContent = pass === "VIP" ? "VIP 🎟️" : pass === "Student" ? "Student 🎓" : "Regular Pass";
  ticketEl.classList.remove("VIP","Student","Regular");
  ticketEl.classList.add(pass);
}

// Generate/refesh
function refreshTicket(){
  const newId = makeTicketId();
  const newSeat = makeSeat();
  ticketIdEl.textContent = newId;
  seatEl.textContent = newSeat;
  ticketEl.setAttribute("data-id", newId);

  const pass = passTypeSel.value;
  applyPassType(pass);

  const qrData = `${nameInput.value || "Guest"} | ${emailInput.value || "noemail"} | ${newId} | ${newSeat} | ${pass}`;
  generateQR(qrData);

  // Confetti 🎉
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
}

// Init
ticketIdEl.textContent = makeTicketId();
seatEl.textContent = makeSeat();
updatePreview();
generateQR(ticketIdEl.textContent);
ticketEl.setAttribute("data-id", ticketIdEl.textContent);
applyPassType(passTypeSel.value);

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  refreshTicket();
});
[nameInput, emailInput].forEach(inp => inp.addEventListener('input', updatePreview));
passTypeSel.addEventListener('change', ()=> applyPassType(passTypeSel.value));

// HD Download (retina sharp)
downloadBtn.addEventListener('click', async () => {
  // temporarily add .tilt reset for flat render
  ticketEl.classList.remove('tilt');
  const scale = Math.max(window.devicePixelRatio || 1, 1) * 2; // super crisp
  const canvas = await html2canvas(ticketEl, { backgroundColor: "#0b0d17", scale, useCORS: true });
  const link = document.createElement('a');
  link.download = "my-ticket.png";
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
});

// Theme toggle
themeBtn.addEventListener('click', ()=> document.body.classList.toggle('light'));

// Countdown
const eventDate = new Date("Jan 31, 2026 10:00:00").getTime();
setInterval(()=>{
  const now = Date.now();
  const diff = eventDate - now;
  if(diff < 0){ countdownEl.textContent = "Event started!"; return; }
  const d = Math.floor(diff/(1000*60*60*24));
  const h = Math.floor((diff%(1000*60*60*24))/(1000*60*60));
  const m = Math.floor((diff%(1000*60*60))/(1000*60));
  const s = Math.floor((diff%(1000*60))/1000);
  countdownEl.textContent = `Event starts in: ${d}d ${h}h ${m}m ${s}s`;
},1000);

// 3D Tilt
const preview = document.querySelector('.preview-panel');
preview.addEventListener('mousemove', e => {
  const rect = preview.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  ticketEl.style.setProperty('--tilt-x', `${x*18}deg`);
  ticketEl.style.setProperty('--tilt-y', `${-y*18}deg`);
  ticketEl.classList.add('tilt');
});
preview.addEventListener('mouseleave', () => {
  ticketEl.style.setProperty('--tilt-x', '0deg');
  ticketEl.style.setProperty('--tilt-y', '0deg');
  ticketEl.classList.remove('tilt');
});

// ---------- Share (caption + links + Web Share API) ----------
function buildCaption(){
  const name = nameInput.value || "Guest";
  const pass = passTypeSel.value;
  return `🎟️ Excited for TechVerse Summit 2026!\n` +
         `Name: ${name}\nPass: ${pass}\n` +
         `Date: Jan 31, 2026 • 10:00 AM • Austin, TX\n` +
         `#TechVerse #Conference #Learning #Developers`;
}

// Convert ticket to Blob (for native share)
async function getTicketBlob(){
  const scale = Math.max(window.devicePixelRatio || 1, 1) * 2;
  const canvas = await html2canvas(ticketEl, { backgroundColor: "#0b0d17", scale, useCORS: true });
  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png', 1.0));
}

// Native share (if supported)
shareNative.addEventListener('click', async ()=>{
  try{
    const blob = await getTicketBlob();
    const files = [new File([blob], 'ticket.png', { type:'image/png' })];
    const text = buildCaption();
    if(navigator.canShare && navigator.canShare({ files })){
      await navigator.share({ files, text, title:'My TechVerse Ticket' });
    } else if(navigator.share){
      await navigator.share({ text, title:'My TechVerse Ticket' });
      alert("Image sharing not supported on this device. Shared text instead.");
    } else {
      alert("Web Share API not supported. Use the platform buttons below.");
    }
  }catch(err){ console.error(err); alert("Unable to share from this device."); }
});

// Open share links (text-only; image cannot be auto-attached cross-domain)
function openInNew(url){ window.open(url, '_blank', 'noopener'); }
shareLinkedIn.addEventListener('click', ()=>{
  const text = encodeURIComponent(buildCaption());
  const link = encodeURIComponent('https://example.com'); // (Optional) your project page
  openInNew(`https://www.linkedin.com/sharing/share-offsite/?url=${link}&mini=true&summary=${text}`);
});
shareX.addEventListener('click', ()=>{
  const text = encodeURIComponent(buildCaption() + "\nhttps://example.com");
  openInNew(`https://twitter.com/intent/tweet?text=${text}`);
});
shareWhatsApp.addEventListener('click', ()=>{
  const text = encodeURIComponent(buildCaption() + "\nhttps://example.com");
  openInNew(`https://wa.me/?text=${text}`);
});
copyCaption.addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(buildCaption());
    copyCaption.textContent = "✓";
    setTimeout(()=> copyCaption.textContent = "⎘", 1000);
  }catch{ alert("Copy failed—select and copy manually."); }
});

