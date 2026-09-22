import { useEffect, useState } from 'react';
import { iniciarLoginGoogle, intercambiarCodigoPorToken, decodificarToken } from './auth';
import './App.css';

const ALB_HOST = 'http://nexo-alb-326907716.us-east-1.elb.amazonaws.com';
const API_STORES = `${ALB_HOST}/stores`;
const API_USERS = ALB_HOST;
const API_ORDERS = `${ALB_HOST}/orders`;

type Tienda = {
  id: string;
  ownerId: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  horario: string;
  estado: string;
  categoria: string;
  creadoEn: string;
};

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  pictureUrl: string | null;
  rol: string;
  estado: string;
  creadoEn: string;
};

type Conductor = {
  id: string;
  usuarioId: string;
  nombre: string;
  vehiculo: string;
  patente: string;
  estado: string;
  creadoEn: string;
};

type CalificacionTienda = {
  id: string;
  tiendaId: string;
  usuarioId: string;
  puntaje: number;
  comentario: string | null;
  creadoEn: string;
};

type CalificacionConductor = {
  id: string;
  conductorId: string;
  puntaje: number;
  comentario: string | null;
  creadoEn: string;
};

type Estadisticas = {
  totalPedidos: number;
  pedidosHoy: number;
  pedidosActivos: number;
  pedidosCompletados: number;
  pedidosCancelados: number;
  ventasTotales: number;
  comisionTotal: number;
};

const CATEGORIAS = ['TODAS', 'RESTAURANTE', 'BOTILLERIA', 'MERCADO', 'CAFETERIA'];
const ESTADOS_TIENDA = ['TODOS', 'PENDING', 'APPROVED', 'REJECTED'];
const ESTADOS_CONDUCTOR = ['TODOS', 'PENDIENTE_APROBACION', 'DISPONIBLE', 'OCUPADO', 'INACTIVO', 'RECHAZADO'];
const ROLES = ['CLIENTE', 'TIENDA', 'CONDUCTOR', 'ADMIN'];

// --- Íconos SVG simples, sin depender de ninguna librería externa ---

function IconoPaquete() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}
function IconoCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconoBici() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 100-2 1 1 0 000 2zM12 17.5V14l-3-3 4-3 2 3h2" />
    </svg>
  );
}
function IconoCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}
function IconoX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}
function IconoMonedas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1110.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" />
    </svg>
  );
}
function IconoBanco() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
    </svg>
  );
}
function IconoTienda() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-5h16l1 5M4 9v11h16V9M4 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0" />
    </svg>
  );
}
function IconoUsuarios() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function Avatar({ usuario }: { usuario?: Usuario }) {
  const [errorImagen, setErrorImagen] = useState(false);

  if (usuario?.pictureUrl && !errorImagen) {
    return (
      <img
        src={usuario.pictureUrl}
        alt={usuario.nombre}
        className="avatar"
        onError={() => setErrorImagen(true)}
        referrerPolicy="no-referrer"
      />
    );
  }
  const inicial = usuario?.nombre?.charAt(0)?.toUpperCase() ?? '?';
  return <div className="avatar-fallback">{inicial}</div>;
}

function Estrellas({ puntaje }: { puntaje: number }) {
  return (
    <span className="estrellas">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= puntaje ? 'estrella-llena' : 'estrella-vacia'}>★</span>
      ))}
    </span>
  );
}

function App() {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('nexo_admin_token'));
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState<string | null>(null);
  const [vista, setVista] = useState<'tiendas' | 'cuentas' | 'conductores' | 'calificaciones' | 'estadisticas'>('estadisticas');

  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [duenosTiendas, setDuenosTiendas] = useState<Record<string, Usuario>>({});
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [filtroEstadoTienda, setFiltroEstadoTienda] = useState('TODOS');
  const [busquedaTiendas, setBusquedaTiendas] = useState('');
  const [ordenTiendas, setOrdenTiendas] = useState<'az' | 'za' | 'reciente'>('reciente');
  const [estadoTiendas, setEstadoTiendas] = useState('');
  const [motivoAbierto, setMotivoAbierto] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [ordenUsuarios, setOrdenUsuarios] = useState<'az' | 'za' | 'reciente'>('reciente');
  const [estadoUsuarios, setEstadoUsuarios] = useState('');

  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [usuariosConductores, setUsuariosConductores] = useState<Record<string, Usuario>>({});
  const [filtroEstadoConductor, setFiltroEstadoConductor] = useState('TODOS');
  const [busquedaConductores, setBusquedaConductores] = useState('');
  const [ordenConductores, setOrdenConductores] = useState<'az' | 'za' | 'reciente'>('reciente');
  const [estadoConductores, setEstadoConductores] = useState('');
  const [motivoConductorAbierto, setMotivoConductorAbierto] = useState<string | null>(null);
  const [motivoConductor, setMotivoConductor] = useState('');

  const [calTiendas, setCalTiendas] = useState<CalificacionTienda[]>([]);
  const [calConductores, setCalConductores] = useState<CalificacionConductor[]>([]);
  const [subVistaCalificaciones, setSubVistaCalificaciones] = useState<'tiendas' | 'conductores'>('tiendas');
  const [estadoCalificaciones, setEstadoCalificaciones] = useState('');

  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [estadoEstadisticas, setEstadoEstadisticas] = useState('');

  useEffect(() => {
    const procesarLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code && !sessionStorage.getItem('code_procesado')) {
        sessionStorage.setItem('code_procesado', code);
        const nuevoToken = await intercambiarCodigoPorToken(code);
        if (nuevoToken) {
          sessionStorage.setItem('nexo_admin_token', nuevoToken);
          setToken(nuevoToken);
        }
        window.history.replaceState({}, '', '/');
      }
      setCargandoAuth(false);
    };
    procesarLogin();
  }, []);

  useEffect(() => {
    if (token) {
      const payload = decodificarToken(token);
      setEsAdmin((payload['cognito:groups'] || []).includes('ADMIN'));

      fetch(`${API_USERS}/usuarios/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.nombre) setNombreUsuario(data.nombre);
          else setNombreUsuario(payload['email'] || null);
        })
        .catch(() => setNombreUsuario(payload['email'] || null));
    }
  }, [token]);

  useEffect(() => {
    if (!token || !esAdmin) return;
    cargarTiendas();
    cargarUsuarios();
    cargarConductores();
    cargarCalificaciones();
    cargarEstadisticas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, esAdmin]);

  const cerrarSesion = () => {
    sessionStorage.removeItem('nexo_admin_token');
    sessionStorage.removeItem('code_procesado');
    setToken(null);
    setEsAdmin(false);
  };

  const cargarUsuariosPorIds = async (ids: string[]): Promise<Record<string, Usuario>> => {
    const idsUnicos = [...new Set(ids)];
    const resultado: Record<string, Usuario> = {};

    await Promise.all(
      idsUnicos.map(async (id) => {
        try {
          const res = await fetch(`${API_USERS}/usuarios/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            resultado[id] = await res.json();
          }
        } catch {
          // si falla uno puntual, seguimos sin su foto/nombre, no rompe el resto
        }
      })
    );

    return resultado;
  };

  // --- Tiendas ---

  const cargarTiendas = async () => {
    if (!token) return;
    setEstadoTiendas('Cargando...');
    try {
      const res = await fetch(`${API_STORES}/tiendas/todas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setEstadoTiendas('Tu cuenta no tiene rol de administrador.');
        return;
      }
      if (!res.ok) {
        setEstadoTiendas(`Error al conectar con el servidor (${res.status}).`);
        return;
      }
      const data: Tienda[] = await res.json();
      setTiendas(data);
      setEstadoTiendas('');

      const duenos = await cargarUsuariosPorIds(data.map((t) => t.ownerId));
      setDuenosTiendas(duenos);
    } catch {
      setEstadoTiendas('No se pudo conectar con ms-stores. ¿Está corriendo en el puerto 8082?');
    }
  };

  const aprobar = async (id: string) => {
    const res = await fetch(`${API_STORES}/tiendas/${id}/aprobar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) cargarTiendas();
    else alert('No se pudo aprobar la tienda.');
  };

  const confirmarRechazo = async (id: string) => {
    if (!motivo.trim()) {
      alert('El motivo de rechazo es obligatorio.');
      return;
    }
    const res = await fetch(`${API_STORES}/tiendas/${id}/rechazar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    });
    if (res.ok) {
      setMotivoAbierto(null);
      setMotivo('');
      cargarTiendas();
    } else {
      alert('No se pudo rechazar la tienda.');
    }
  };

  const eliminarTienda = async (id: string, nombre: string) => {
    const confirmado = window.confirm(`¿Eliminar "${nombre}" definitivamente?`);
    if (!confirmado) return;

    const res = await fetch(`${API_STORES}/tiendas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      cargarTiendas();
    } else if (res.status === 409) {
      alert('No se puede eliminar: la tienda tiene productos asociados. Eliminalos primero desde ms-products.');
    } else {
      alert('No se pudo eliminar la tienda.');
    }
  };

  // --- Cuentas de usuario ---

  const cargarUsuarios = async () => {
    if (!token) return;
    setEstadoUsuarios('Cargando...');
    try {
      const res = await fetch(`${API_USERS}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setEstadoUsuarios('Tu cuenta no tiene rol de administrador.');
        return;
      }
      if (!res.ok) {
        setEstadoUsuarios(`Error al conectar con el servidor (${res.status}).`);
        return;
      }
      setUsuarios(await res.json());
      setEstadoUsuarios('');
    } catch {
      setEstadoUsuarios('No se pudo conectar con ms-users. ¿Está corriendo en el puerto 8081?');
    }
  };

  const cambiarRol = async (id: string, nuevoRol: string) => {
    const res = await fetch(`${API_USERS}/usuarios/${id}/rol`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: nuevoRol }),
    });
    if (res.ok) cargarUsuarios();
    else alert('No se pudo cambiar el rol.');
  };

  const eliminarUsuario = async (id: string, nombre: string) => {
    const confirmado = window.confirm(
      `¿Eliminar el registro de "${nombre}"?\n\nEsto NO elimina su cuenta de Google: si vuelve a iniciar sesión, se creará de nuevo automáticamente.`
    );
    if (!confirmado) return;

    const res = await fetch(`${API_USERS}/usuarios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) cargarUsuarios();
    else alert('No se pudo eliminar el usuario.');
  };

  // --- Conductores ---

  const cargarConductores = async () => {
    if (!token) return;
    setEstadoConductores('Cargando...');
    try {
      const res = await fetch(`${API_USERS}/conductores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setEstadoConductores('Tu cuenta no tiene rol de administrador.');
        return;
      }
      if (!res.ok) {
        setEstadoConductores(`Error al conectar con el servidor (${res.status}).`);
        return;
      }
      const data: Conductor[] = await res.json();
      setConductores(data);
      setEstadoConductores('');

      const usuariosMap = await cargarUsuariosPorIds(data.map((c) => c.usuarioId));
      setUsuariosConductores(usuariosMap);
    } catch {
      setEstadoConductores('No se pudo conectar con ms-users. ¿Está corriendo en el puerto 8081?');
    }
  };

  const aprobarConductor = async (id: string) => {
    const res = await fetch(`${API_USERS}/conductores/${id}/aprobar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) cargarConductores();
    else alert('No se pudo aprobar el conductor.');
  };

  const rechazarConductor = async (id: string) => {
    if (!motivoConductor.trim()) {
      alert('El motivo de rechazo es obligatorio.');
      return;
    }
    const res = await fetch(`${API_USERS}/conductores/${id}/rechazar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo: motivoConductor }),
    });
    if (res.ok) {
      setMotivoConductorAbierto(null);
      setMotivoConductor('');
      cargarConductores();
    } else {
      alert('No se pudo rechazar el conductor.');
    }
  };

  const eliminarConductor = async (id: string, nombre: string) => {
    const confirmado = window.confirm(`¿Eliminar el registro de "${nombre}" definitivamente?`);
    if (!confirmado) return;

    const res = await fetch(`${API_USERS}/conductores/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) cargarConductores();
    else alert('No se pudo eliminar el conductor.');
  };

  // --- Calificaciones ---

  const cargarCalificaciones = async () => {
    if (!token) return;
    setEstadoCalificaciones('Cargando...');
    try {
      const [resTiendas, resConductores] = await Promise.all([
        fetch(`${API_STORES}/admin/calificaciones-tiendas`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_USERS}/conductores/calificaciones/todas`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (resTiendas.ok) setCalTiendas(await resTiendas.json());
      if (resConductores.ok) setCalConductores(await resConductores.json());
      setEstadoCalificaciones('');
    } catch {
      setEstadoCalificaciones('No se pudieron cargar las calificaciones.');
    }
  };

  // --- Estadísticas ---

  const cargarEstadisticas = async () => {
    if (!token) return;
    setEstadoEstadisticas('Cargando...');
    try {
      const res = await fetch(`${API_ORDERS}/pedidos/estadisticas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setEstadoEstadisticas('Tu cuenta no tiene rol de administrador.');
        return;
      }
      if (!res.ok) {
        setEstadoEstadisticas(`Error al conectar con el servidor (${res.status}).`);
        return;
      }
      setEstadisticas(await res.json());
      setEstadoEstadisticas('');
    } catch {
      setEstadoEstadisticas('No se pudo conectar con ms-orders. ¿Está corriendo en el puerto 8084?');
    }
  };

  if (cargandoAuth) {
    return <div className="pagina-login"><p>Cargando...</p></div>;
  }

  if (!token) {
    return (
      <div className="pagina-login">
        <img src="/logonexo.jpg" alt="NEXO" className="logo-login" />
        <h1>NEXO</h1>
        <p className="sub">Panel de administración</p>
        <button className="btn-primario" onClick={iniciarLoginGoogle}>
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="pagina-login">
        <p>Tu cuenta no tiene permisos de administrador.</p>
        <button className="btn-rechazar" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    );
  }

  const texto = (s: string) => s.toLowerCase();
  const ordenarPorFecha = (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime();
  const primerNombre = nombreUsuario ? nombreUsuario.split(' ')[0] : 'administrador';

  const tiendasFiltradas = tiendas
    .filter((t) => filtroCategoria === 'TODAS' || t.categoria === filtroCategoria)
    .filter((t) => filtroEstadoTienda === 'TODOS' || t.estado === filtroEstadoTienda)
    .filter((t) =>
      busquedaTiendas.trim() === '' ||
      texto(t.nombre).includes(texto(busquedaTiendas)) ||
      texto(t.direccion).includes(texto(busquedaTiendas))
    )
    .sort((a, b) => {
      if (ordenTiendas === 'reciente') return ordenarPorFecha(a.creadoEn, b.creadoEn);
      return ordenTiendas === 'az' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre);
    });

  const usuariosFiltrados = usuarios
    .filter((u) =>
      busquedaUsuarios.trim() === '' ||
      texto(u.nombre).includes(texto(busquedaUsuarios)) ||
      texto(u.email).includes(texto(busquedaUsuarios))
    )
    .sort((a, b) => {
      if (ordenUsuarios === 'reciente') return ordenarPorFecha(a.creadoEn, b.creadoEn);
      return ordenUsuarios === 'az' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre);
    });

  const conductoresFiltrados = conductores
    .filter((c) => filtroEstadoConductor === 'TODOS' || c.estado === filtroEstadoConductor)
    .filter((c) =>
      busquedaConductores.trim() === '' ||
      texto(c.nombre).includes(texto(busquedaConductores)) ||
      texto(c.patente).includes(texto(busquedaConductores))
    )
    .sort((a, b) => {
      if (ordenConductores === 'reciente') return ordenarPorFecha(a.creadoEn, b.creadoEn);
      return ordenConductores === 'az' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre);
    });

  const tiendasPendientes = tiendas.filter((t) => t.estado === 'PENDING').length;
  const conductoresPendientes = conductores.filter((c) => c.estado === 'PENDIENTE_APROBACION').length;

  const promedioTiendas = calTiendas.length > 0
    ? (calTiendas.reduce((acc, c) => acc + c.puntaje, 0) / calTiendas.length).toFixed(1)
    : '—';
  const promedioConductores = calConductores.length > 0
    ? (calConductores.reduce((acc, c) => acc + c.puntaje, 0) / calConductores.length).toFixed(1)
    : '—';

  const formatoCLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

  return (
    <div className="pagina">
      <header>
        <div className="marca">
          <img src="/logonexo.jpg" alt="NEXO" className="logo-header" />
          <div className="marca-texto">
            <span className="saludo">Hola, {primerNombre}</span>
            <span className="sub">Panel de administración NEXO</span>
          </div>
        </div>
        <button className="btn-rechazar" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      <main>
        <div className="nav-principal">
          <button
            className={vista === 'estadisticas' ? 'filtro-activo' : 'filtro'}
            onClick={() => setVista('estadisticas')}
          >
            Estadísticas
          </button>
          <button
            className={vista === 'tiendas' ? 'filtro-activo' : 'filtro'}
            onClick={() => setVista('tiendas')}
          >
            Tiendas
            {tiendasPendientes > 0 && <span className="badge-pendiente">{tiendasPendientes}</span>}
          </button>
          <button
            className={vista === 'cuentas' ? 'filtro-activo' : 'filtro'}
            onClick={() => setVista('cuentas')}
          >
            Cuentas
          </button>
          <button
            className={vista === 'conductores' ? 'filtro-activo' : 'filtro'}
            onClick={() => setVista('conductores')}
          >
            Conductores
            {conductoresPendientes > 0 && <span className="badge-pendiente">{conductoresPendientes}</span>}
          </button>
          <button
            className={vista === 'calificaciones' ? 'filtro-activo' : 'filtro'}
            onClick={() => setVista('calificaciones')}
          >
            Calificaciones
          </button>
        </div>

        {vista === 'estadisticas' && (
          <>
            <button className="btn-primario" onClick={cargarEstadisticas}>
              Actualizar
            </button>
            <div className="estado">{estadoEstadisticas}</div>

            {estadisticas && (
              <div className="grid-stats">
                <div className="stat-card">
                  <div className="stat-icono-wrapper"><IconoPaquete /></div>
                  <span className="stat-valor">{estadisticas.totalPedidos}</span>
                  <span className="stat-label">Pedidos totales</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icono-wrapper"><IconoCalendario /></div>
                  <span className="stat-valor">{estadisticas.pedidosHoy}</span>
                  <span className="stat-label">Pedidos hoy</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icono-wrapper"><IconoBici /></div>
                  <span className="stat-valor">{estadisticas.pedidosActivos}</span>
                  <span className="stat-label">En curso</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icono-wrapper"><IconoCheck /></div>
                  <span className="stat-valor">{estadisticas.pedidosCompletados}</span>
                  <span className="stat-label">Completados</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icono-wrapper"><IconoX /></div>
                  <span className="stat-valor">{estadisticas.pedidosCancelados}</span>
                  <span className="stat-label">Cancelados</span>
                </div>
                <div className="stat-card stat-card-destacada">
                  <div className="stat-icono-wrapper"><IconoMonedas /></div>
                  <span className="stat-valor">{formatoCLP(estadisticas.ventasTotales)}</span>
                  <span className="stat-label">Ventas totales</span>
                </div>
                <div className="stat-card stat-card-destacada">
                  <div className="stat-icono-wrapper"><IconoBanco /></div>
                  <span className="stat-valor">{formatoCLP(estadisticas.comisionTotal)}</span>
                  <span className="stat-label">Comisión de la plataforma</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icono-wrapper"><IconoTienda /></div>
                  <span className="stat-valor">{tiendas.length}</span>
                  <span className="stat-label">Tiendas registradas</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icono-wrapper"><IconoBici /></div>
                  <span className="stat-valor">{conductores.length}</span>
                  <span className="stat-label">Conductores registrados</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icono-wrapper"><IconoUsuarios /></div>
                  <span className="stat-valor">{usuarios.length}</span>
                  <span className="stat-label">Cuentas totales</span>
                </div>
              </div>
            )}
          </>
        )}

        {vista === 'tiendas' && (
          <>
            <button className="btn-primario" onClick={cargarTiendas}>
              Actualizar listado
            </button>

            <div className="panel-controles">
              <input
                className="busqueda"
                type="text"
                placeholder="Buscar por nombre o dirección..."
                value={busquedaTiendas}
                onChange={(e) => setBusquedaTiendas(e.target.value)}
              />

              <div className="fila-control">
                <span className="etiqueta-filtro">Categoría</span>
                <div className="filtros">
                  {CATEGORIAS.map((cat) => (
                    <button
                      key={cat}
                      className={filtroCategoria === cat ? 'filtro-activo' : 'filtro'}
                      onClick={() => setFiltroCategoria(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fila-control">
                <span className="etiqueta-filtro">Estado</span>
                <div className="filtros">
                  {ESTADOS_TIENDA.map((est) => (
                    <button
                      key={est}
                      className={filtroEstadoTienda === est ? 'filtro-activo' : 'filtro'}
                      onClick={() => setFiltroEstadoTienda(est)}
                    >
                      {est}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fila-control">
                <span className="etiqueta-filtro">Orden</span>
                <div className="filtros">
                  <button className={ordenTiendas === 'reciente' ? 'filtro-activo' : 'filtro'} onClick={() => setOrdenTiendas('reciente')}>
                    Más reciente
                  </button>
                  <button className={ordenTiendas === 'az' ? 'filtro-activo' : 'filtro'} onClick={() => setOrdenTiendas('az')}>
                    A-Z
                  </button>
                  <button className={ordenTiendas === 'za' ? 'filtro-activo' : 'filtro'} onClick={() => setOrdenTiendas('za')}>
                    Z-A
                  </button>
                </div>
              </div>
            </div>

            <div className="estado">
              {estadoTiendas || (tiendas.length > 0 && `${tiendasFiltradas.length} de ${tiendas.length} tiendas`)}
            </div>

            {tiendasFiltradas.length === 0 && !estadoTiendas && (
              <div className="vacio">No hay tiendas que coincidan con la búsqueda.</div>
            )}

            {tiendasFiltradas.map((tienda) => {
              const dueno = duenosTiendas[tienda.ownerId];
              return (
                <div className="tarjeta" key={tienda.id}>
                  <div className="tarjeta-header">
                    <h3>{tienda.nombre}</h3>
                    <span className={`etiqueta-estado etiqueta-${tienda.estado.toLowerCase()}`}>
                      {tienda.estado}
                    </span>
                  </div>
                  <p className="categoria">{tienda.categoria}</p>
                  <p>{tienda.descripcion}</p>
                  <p>Dirección: {tienda.direccion}</p>
                  <p>Horario: {tienda.horario || 'no especificado'}</p>

                  {dueno && (
                    <div className="solicitante">
                      <Avatar usuario={dueno} />
                      <span className="solicitante-texto">Dueño: {dueno.nombre} · {dueno.email}</span>
                    </div>
                  )}

                  <p className="fecha">Creada: {new Date(tienda.creadoEn).toLocaleDateString('es-CL')}</p>

                  <div className="acciones">
                    {tienda.estado === 'PENDING' && (
                      <>
                        <button className="btn-aprobar" onClick={() => aprobar(tienda.id)}>Aprobar</button>
                        <button
                          className="btn-rechazar"
                          onClick={() => setMotivoAbierto(motivoAbierto === tienda.id ? null : tienda.id)}
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    <button className="btn-eliminar" onClick={() => eliminarTienda(tienda.id, tienda.nombre)}>
                      Eliminar
                    </button>
                  </div>

                  {motivoAbierto === tienda.id && (
                    <div className="caja-motivo">
                      <textarea
                        placeholder="Explicá por qué se rechaza esta tienda..."
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                      />
                      <button className="btn-rechazar" onClick={() => confirmarRechazo(tienda.id)}>
                        Confirmar rechazo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {vista === 'cuentas' && (
          <>
            <button className="btn-primario" onClick={cargarUsuarios}>
              Actualizar listado
            </button>

            <div className="panel-controles">
              <input
                className="busqueda"
                type="text"
                placeholder="Buscar por nombre o email..."
                value={busquedaUsuarios}
                onChange={(e) => setBusquedaUsuarios(e.target.value)}
              />

              <div className="fila-control">
                <span className="etiqueta-filtro">Orden</span>
                <div className="filtros">
                  <button className={ordenUsuarios === 'reciente' ? 'filtro-activo' : 'filtro'} onClick={() => setOrdenUsuarios('reciente')}>
                    Más reciente
                  </button>
                  <button className={ordenUsuarios === 'az' ? 'filtro-activo' : 'filtro'} onClick={() => setOrdenUsuarios('az')}>
                    A-Z
                  </button>
                  <button className={ordenUsuarios === 'za' ? 'filtro-activo' : 'filtro'} onClick={() => setOrdenUsuarios('za')}>
                    Z-A
                  </button>
                </div>
              </div>
            </div>

            <div className="estado">
              {estadoUsuarios || (usuarios.length > 0 && `${usuariosFiltrados.length} de ${usuarios.length} cuentas`)}
            </div>

            {usuariosFiltrados.length === 0 && !estadoUsuarios && (
              <div className="vacio">No hay cuentas que coincidan con la búsqueda.</div>
            )}

            {usuariosFiltrados.map((usuario) => (
              <div className="tarjeta" key={usuario.id}>
                <div className="tarjeta-header">
                  <div className="usuario-info">
                    <Avatar usuario={usuario} />
                    <h3>{usuario.nombre}</h3>
                  </div>
                  <span className="etiqueta-estado etiqueta-approved">{usuario.rol}</span>
                </div>
                <p>Correo: {usuario.email}</p>
                <p>Estado: {usuario.estado}</p>
                <p className="fecha">Registrado: {new Date(usuario.creadoEn).toLocaleDateString('es-CL')}</p>

                <div className="fila-control" style={{ marginTop: 12, marginBottom: 0 }}>
                  <span className="etiqueta-filtro" style={{ color: 'var(--gris)' }}>Cambiar rol</span>
                  <div className="filtros">
                    {ROLES.map((rol) => {
                      const claseColor = `filtro-rol-${rol.toLowerCase()}`;
                      const claseBase = usuario.rol === rol ? 'filtro-activo' : 'filtro';
                      return (
                        <button
                          key={rol}
                          className={`${claseBase} ${claseColor}`}
                          onClick={() => rol !== usuario.rol && cambiarRol(usuario.id, rol)}
                        >
                          {rol}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="acciones">
                  <button className="btn-eliminar" onClick={() => eliminarUsuario(usuario.id, usuario.nombre)}>
                    Eliminar registro
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {vista === 'conductores' && (
          <>
            <button className="btn-primario" onClick={cargarConductores}>
              Actualizar listado
            </button>

            <div className="panel-controles">
              <input
                className="busqueda"
                type="text"
                placeholder="Buscar por nombre o patente..."
                value={busquedaConductores}
                onChange={(e) => setBusquedaConductores(e.target.value)}
              />

              <div className="fila-control">
                <span className="etiqueta-filtro">Estado</span>
                <div className="filtros">
                  {ESTADOS_CONDUCTOR.map((est) => (
                    <button
                      key={est}
                      className={filtroEstadoConductor === est ? 'filtro-activo' : 'filtro'}
                      onClick={() => setFiltroEstadoConductor(est)}
                    >
                      {est}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fila-control">
                <span className="etiqueta-filtro">Orden</span>
                <div className="filtros">
                  <button className={ordenConductores === 'reciente' ? 'filtro-activo' : 'filtro'} onClick={() => setOrdenConductores('reciente')}>
                    Más reciente
                  </button>
                  <button className={ordenConductores === 'az' ? 'filtro-activo' : 'filtro'} onClick={() => setOrdenConductores('az')}>
                    A-Z
                  </button>
                  <button className={ordenConductores === 'za' ? 'filtro-activo' : 'filtro'} onClick={() => setOrdenConductores('za')}>
                    Z-A
                  </button>
                </div>
              </div>
            </div>

            <div className="estado">
              {estadoConductores || (conductores.length > 0 && `${conductoresFiltrados.length} de ${conductores.length} conductores`)}
            </div>

            {conductoresFiltrados.length === 0 && !estadoConductores && (
              <div className="vacio">No hay conductores que coincidan con la búsqueda.</div>
            )}

            {conductoresFiltrados.map((conductor) => {
              const usuarioConductor = usuariosConductores[conductor.usuarioId];
              return (
                <div className="tarjeta" key={conductor.id}>
                  <div className="tarjeta-header">
                    <h3>{conductor.nombre}</h3>
                    <span className={`etiqueta-estado etiqueta-${conductor.estado.toLowerCase()}`}>
                      {conductor.estado}
                    </span>
                  </div>
                  <p>Vehículo: {conductor.vehiculo} — Patente: {conductor.patente}</p>

                  {usuarioConductor && (
                    <div className="solicitante">
                      <Avatar usuario={usuarioConductor} />
                      <span className="solicitante-texto">{usuarioConductor.nombre} · {usuarioConductor.email}</span>
                    </div>
                  )}

                  <p className="fecha">Registrado: {new Date(conductor.creadoEn).toLocaleDateString('es-CL')}</p>

                  <div className="acciones">
                    {conductor.estado === 'PENDIENTE_APROBACION' && (
                      <>
                        <button className="btn-aprobar" onClick={() => aprobarConductor(conductor.id)}>Aprobar</button>
                        <button
                          className="btn-rechazar"
                          onClick={() => setMotivoConductorAbierto(motivoConductorAbierto === conductor.id ? null : conductor.id)}
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    <button className="btn-eliminar" onClick={() => eliminarConductor(conductor.id, conductor.nombre)}>
                      Eliminar
                    </button>
                  </div>

                  {motivoConductorAbierto === conductor.id && (
                    <div className="caja-motivo">
                      <textarea
                        placeholder="Explicá por qué se rechaza este conductor..."
                        value={motivoConductor}
                        onChange={(e) => setMotivoConductor(e.target.value)}
                      />
                      <button className="btn-rechazar" onClick={() => rechazarConductor(conductor.id)}>
                        Confirmar rechazo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {vista === 'calificaciones' && (
          <>
            <button className="btn-primario" onClick={cargarCalificaciones}>
              Actualizar listado
            </button>

            <div className="grid-stats" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <div className="stat-icono-wrapper"><IconoTienda /></div>
                <span className="stat-valor">{promedioTiendas}</span>
                <span className="stat-label">Promedio tiendas</span>
              </div>
              <div className="stat-card">
                <div className="stat-icono-wrapper"><IconoBici /></div>
                <span className="stat-valor">{promedioConductores}</span>
                <span className="stat-label">Promedio conductores</span>
              </div>
            </div>

            <div className="nav-principal" style={{ marginBottom: 20 }}>
              <button
                className={subVistaCalificaciones === 'tiendas' ? 'filtro-activo' : 'filtro'}
                onClick={() => setSubVistaCalificaciones('tiendas')}
              >
                Tiendas ({calTiendas.length})
              </button>
              <button
                className={subVistaCalificaciones === 'conductores' ? 'filtro-activo' : 'filtro'}
                onClick={() => setSubVistaCalificaciones('conductores')}
              >
                Conductores ({calConductores.length})
              </button>
            </div>

            <div className="estado">{estadoCalificaciones}</div>

            {subVistaCalificaciones === 'tiendas' ? (
              calTiendas.length === 0 && !estadoCalificaciones ? (
                <div className="vacio">Todavía no hay calificaciones de tiendas.</div>
              ) : (
                calTiendas.map((c) => {
                  const tienda = tiendas.find((t) => t.id === c.tiendaId);
                  return (
                    <div className="tarjeta" key={c.id}>
                      <div className="tarjeta-header">
                        <h3>{tienda?.nombre ?? 'Tienda'}</h3>
                        <Estrellas puntaje={c.puntaje} />
                      </div>
                      <p>{c.comentario || 'Sin comentario'}</p>
                      <p className="fecha">{new Date(c.creadoEn).toLocaleDateString('es-CL')}</p>
                    </div>
                  );
                })
              )
            ) : calConductores.length === 0 && !estadoCalificaciones ? (
              <div className="vacio">Todavía no hay calificaciones de conductores.</div>
            ) : (
              calConductores.map((c) => {
                const conductor = conductores.find((cond) => cond.id === c.conductorId);
                return (
                  <div className="tarjeta" key={c.id}>
                    <div className="tarjeta-header">
                      <h3>{conductor?.nombre ?? 'Conductor'}</h3>
                      <Estrellas puntaje={c.puntaje} />
                    </div>
                    <p>{c.comentario || 'Sin comentario'}</p>
                    <p className="fecha">{new Date(c.creadoEn).toLocaleDateString('es-CL')}</p>
                  </div>
                );
              })
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;