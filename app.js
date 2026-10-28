(() => {
  const datos = window.RECREO || {};
  const wsp = `https://wa.me/${datos.whatsapp}?text=${encodeURIComponent(datos.mensaje || '')}`;
  const turnos = datos.turnosUrl || '#turnos';

  for (const a of document.querySelectorAll('[data-wsp]')) a.href = wsp;
  for (const a of document.querySelectorAll('[data-ig]')) a.href = datos.instagram;
  for (const a of document.querySelectorAll('[data-turnos]')) {
    a.href = turnos;
    a.addEventListener('click', irALaAgenda);
  }

  const aviso = document.getElementById('aviso');
  aviso.querySelector('[data-cerrar]').addEventListener('click', () => aviso.close());

  // El link del puente cambia; si ya no existe, mejor avisar que mostrar el error del navegador.
  async function irALaAgenda(evento) {
    evento.preventDefault();
    const boton = evento.currentTarget;
    boton.classList.add('cargando');
    const corte = new AbortController();
    const reloj = setTimeout(() => corte.abort(), 6000);
    try {
      await fetch(turnos, { mode: 'no-cors', cache: 'no-store', signal: corte.signal });
      window.location.href = turnos;
    } catch {
      aviso.showModal();
    } finally {
      clearTimeout(reloj);
      boton.classList.remove('cargando');
    }
  }

  document.getElementById('anio').textContent = new Date().getFullYear();

  const barra = document.querySelector('.barra');
  const marcar = () => barra.classList.toggle('con-sombra', window.scrollY > 8);
  window.addEventListener('scroll', marcar, { passive: true });
  marcar();

  if (!('IntersectionObserver' in window)) return;
  const mirar = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('visible');
      mirar.unobserve(e.target);
    }
  }, { threshold: 0.15 });
  for (const el of document.querySelectorAll('.area, .pasos li, .destacados a')) {
    el.classList.add('aparece');
    mirar.observe(el);
  }
})();
