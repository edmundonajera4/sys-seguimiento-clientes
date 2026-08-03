// src/components/PublicStatus.jsx
/**
 * Página pública de estatus del ticket
 * Accesible desde /estado/:CODIGO sin necesidad de iniciar sesión
 * 
 * Usa RPC (Remote Procedure Calls) para consultar datos de forma segura:
 * - get_ticket_publico: devuelve info del ticket + cliente
 * - get_pagos_publico: devuelve desglose de pagos
 * 
 * Esto evita exponer las tablas directamente al público anónimo.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function PublicStatus() {
  // Obtener el código del ticket desde la URL (/estado/CODIGO)
  const { codigo } = useParams();
  
  // Estados para manejar la carga, errores y datos
  const [ticket, setTicket] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch del ticket y sus pagos al montar el componente
   * Se ejecuta una sola vez cuando cambia el código en la URL
   */
  useEffect(() => {
    async function fetchTicketData() {
      if (!codigo) {
        setError('Código de ticket no proporcionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 👇 LLAMADA RPC PARA DATOS DEL TICKET
        // Esta función consulta la tabla tickets con JOIN en clientes
        // y solo devuelve filas donde codigo == parámetro pasado
        const { data: ticketData, error: ticketError } = await supabase
          .rpc('get_ticket_publico', { p_codigo: codigo })
          .single(); // Solo esperamos 1 resultado máximo

        if (ticketError) {
          throw new Error(`Error al cargar ticket: ${ticketError.message}`);
        }

        // Si el ticket no existe, data será null
        if (!ticketData) {
          setError('Ticket no encontrado. Verifica el código.');
          setLoading(false);
          return;
        }

        // 👇 LLAMADA RPC PARA PAGOS DEL TICKET
        // Esta función devuelve todos los pagos asociados a ese código
        const { data: pagosData, error: pagosError } = await supabase
          .rpc('get_pagos_publico', { p_codigo: codigo });

        if (pagosError) {
          throw new Error(`Error al cargar pagos: ${pagosError.message}`);
        }

        // Guardar datos en el estado
        setTicket(ticketData);
        setPagos(pagosData || []);

      } catch (err) {
        console.error('Error en fetchTicketData:', err);
        setError(err.message || 'Ocurrió un error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchTicketData();
  }, [codigo]);

  /**
   * Calcular saldo pendiente basado en los datos recibidos
   * costo_total - sum(pagos) = saldo_pendiente
   */
  function calcularSaldoPendiente() {
    if (!ticket || ticket.costo_total === null || ticket.costo_total === undefined) {
      return null; // Aún no se ha definido el costo
    }

    const totalPagado = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
    return ticket.costo_total - totalPagado;
  }

  /**
   * Determinar mensaje según estado del ticket
   */
  function getMensajePorEstado(estado) {
    switch (estado) {
      case 'recibido':
        return 'Hemos recibido tu equipo. Estamos iniciando el proceso.';
      case 'diagnostico':
        return 'Estamos diagnosticando tu equipo.';
      case 'reparacion':
        return 'Tu equipo está en reparación.';
      case 'espera_refaccion':
        return 'Estamos esperando refacciones para continuar tu reparación.';
      case 'listo':
        return '¡Tu equipo está listo para recoger!';
      case 'entregado':
        return 'Tu equipo ha sido entregado. ¡Gracias por tu confianza!';
      default:
        return 'Estado no reconocido.';
    }
  }

  /**
   * Formatear moneda a pesos mexicanos
   */
  function formatMoney(amount) {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  }

  /**
   * Formatear fecha legible
   */
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Ticket no disponible
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  const saldoPendiente = calcularSaldoPendiente();
  const saldoListoParaEntrega = saldoPendiente !== null && saldoPendiente <= 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* ==================== HEADER CON CÓDIGO Y ESTADO ==================== */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Estás siguiendo:
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Código: <span className="font-mono font-semibold">{ticket.codigo}</span>
              </p>
            </div>
            
            {/* Badge de estado con colores */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              ticket.estado === 'listo' || ticket.estado === 'entregado' 
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {ticket.estado.toUpperCase()}
            </span>
          </div>

          {/* Mensaje informativo según estado */}
          <p className="text-gray-700 mb-4">
            {getMensajePorEstado(ticket.estado)}
          </p>

          {/* Información básica del equipo */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Cliente:</span>
              <p className="font-medium">{ticket.cliente_nombre}</p>
            </div>
            <div>
              <span className="text-gray-500">Teléfono:</span>
              <p className="font-medium">{ticket.cliente_telefono}</p>
            </div>
          </div>

          <hr className="my-4" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Equip</span>
              <p className="font-medium">{ticket.equipo_marca} {ticket.equipo_modelo}</p>
            </div>
            <div>
              <span className="text-gray-500">Falla reportada:</span>
              <p className="font-medium">{ticket.falla_reportada}</p>
            </div>
            <div>
              <span className="text-gray-500">Fecha de recepción:</span>
              <p className="font-medium">{formatDate(ticket.fecha_recepcion)}</p>
            </div>
            <div>
              <span className="text-gray-500">Notas internas:</span>
              <p className="font-medium text-gray-600">
                {ticket.notas_internas || 'Sin notas'}
              </p>
            </div>
          </div>
        </div>

        {/* ==================== COSTO Y SALDO ==================== */}
        {ticket.costo_total !== null && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Detalles de cobro</h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Costo total:</span>
                <span className="font-semibold">{formatMoney(ticket.costo_total)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Abono inicial:</span>
                <span className="font-semibold">{formatMoney(ticket.abono)}</span>
              </div>

              {pagos.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Total pagado:</span>
                  <span className="font-semibold">
                    {formatMoney(
                      pagos.reduce((sum, p) => sum + Number(p.monto), 0)
                    )}
                  </span>
                </div>
              )}

              {/* Saldo pendiente destacado */}
              {saldoPendiente !== null && (
                <div className={`border-t pt-3 ${
                  saldoListoParaEntrega 
                    ? 'border-green-200' 
                    : 'border-gray-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${
                      saldoListoParaEntrega ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      Saldo pendiente:
                    </span>
                    <span className={`text-xl font-bold ${
                      saldoListoParaEntrega 
                        ? 'text-green-600' 
                        : 'text-purple-600'
                    }`}>
                      {saldoListoParaEntrega 
                        ? '¡Listo para entrega!' 
                        : formatMoney(saldoPendiente)
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== DESGLOSE DE PAGOS ==================== */}
        {pagos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Historial de pagos</h2>
            
            <div className="space-y-2">
              {pagos.map((pago) => (
                <div 
                  key={pago.id} 
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <span className="text-gray-600">
                    {pago.tipo === 'abono' ? 'Abono' : 'Pago final'}
                  </span>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900 mr-3">
                      {formatMoney(pago.monto)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(pago.fecha_pago)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== FOOTER ==================== */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Si tienes dudas, contáctanos con tu código de ticket.</p>
        </div>
      </div>
    </div>
  );
}