// src/components/PublicStatus.jsx
/**
 * Página pública de estatus del ticket
 * Diseño limpio y moderno para clientes
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function PublicStatus() {
  const { codigo } = useParams();
  
  const [ticket, setTicket] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        const { data: ticketData, error: ticketError } = await supabase
          .rpc('get_ticket_publico', { p_codigo: codigo })
          .single();

        if (ticketError || !ticketData) {
          throw new Error('Ticket no encontrado');
        }

        const { data: pagosData, error: pagosError } = await supabase
          .rpc('get_pagos_publico', { p_codigo: codigo });

        if (pagosError) {
          console.warn('Error cargando pagos:', pagosError.message);
        }

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

  function calcularSaldoPendiente() {
    if (!ticket || ticket.costo_total === null) return null;
    const totalPagado = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
    return ticket.costo_total - totalPagado;
  }

  function formatMoney(amount) {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Estado y mensajes
  const MENSAJES_ESTADO = {
    recibido: 'Hemos recibido tu equipo. Estamos iniciando el proceso.',
    diagnostico: 'Estamos diagnosticando tu equipo.',
    reparacion: 'Tu equipo está en reparación.',
    espera_refaccion: 'Estamos esperando refacciones para continuar.',
    listo: '¡Tu equipo está listo para recoger!',
    entregado: '¡Gracias por tu confianza! Equipo entregado.',
  };

  const labelEstado = ticket ? ticket.estado.toUpperCase().replace('_', ' ') : '';
  const saldoPendiente = calcularSaldoPendiente();
  const saldoListoParaEntrega = saldoPendiente !== null && saldoPendiente <= 0;

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="public-wrap">
        <div className="public-card public-loading">
          <div className="public-brand">Cargando...</div>
          <p className="public-muted">Consultando tu ticket</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-wrap">
        <div className="public-card public-empty">
          <div className="public-brand">Taller de Reparación</div>
          <p className="public-error">
            No encontramos un ticket con el código <strong>{codigo}</strong>.
          </p>
          <p className="public-muted">Verifica el enlace o contacta directamente al local.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-wrap">
      <div className="public-card">
        
        {/* Marca / Logo */}
        <div className="public-brand">Taller de Reparación</div>

        {/* Badge de estado */}
        <span className={`public-badge public-badge-${ticket.estado}`}>
          {labelEstado}
        </span>

        {/* Información del cliente */}
        <div className="public-client-info">
          <p className="public-client-name">{ticket.cliente_nombre}</p>
          <p className="public-client-phone">{ticket.cliente_telefono}</p>
        </div>

        {/* Información del equipo */}
        <p className="public-equipo">
          {ticket.equipo_marca} {ticket.equipo_modelo}
        </p>

        {/* Serial e IMEI (solo si existen) */}
        {(ticket.numero_serie || ticket.imei) && (
          <div className="public-device-details">
            {ticket.numero_serie && (
              <p className="public-detail-item">
                <span className="public-detail-label">Serial:</span>
                <span className="public-detail-value font-mono">{ticket.numero_serie}</span>
              </p>
            )}
            {ticket.imei && (
              <p className="public-detail-item">
                <span className="public-detail-label">IMEI:</span>
                <span className="public-detail-value font-mono">{ticket.imei}</span>
              </p>
            )}
          </div>
        )}

        {/* Falla reportada */}
        {ticket.falla_reportada && (
          <p className="public-falla">
            <span className="public-detail-label">Falla:</span> {ticket.falla_reportada}
          </p>
        )}

        {/* Mensaje según estado */}
        <p className="public-mensaje">{MENSAJES_ESTADO[ticket.estado]}</p>

        {/* Costos y saldo */}
        {ticket.costo_total != null && (
          <div className="public-cuenta">
            <h3 className="public-cuenta-title">Detalles de cobro</h3>
            
            <div className="public-cuenta-row">
              <span>Costo total</span>
              <span>{formatMoney(ticket.costo_total)}</span>
            </div>
            
            <div className="public-cuenta-row">
              <span>Total pagado</span>
              <span>{formatMoney(
                pagos.reduce((sum, p) => sum + Number(p.monto), 0)
              )}</span>
            </div>
            
            {pagos.length > 0 && ticket.abono > 0 && (
              <div className="public-cuenta-row public-cuenta-abono">
                <span>Abono inicial</span>
                <span>{formatMoney(ticket.abono)}</span>
              </div>
            )}
            
            <div className={`public-cuenta-row public-cuenta-saldo ${
              saldoListoParaEntrega ? 'public-saldo-ok' : ''
            }`}>
              <span>Saldo a pagar</span>
              <span className="public-saldo-amount">
                {saldoListoParaEntrega 
                  ? '✓ Listo para entrega'
                  : formatMoney(saldoPendiente)
                }
              </span>
            </div>
          </div>
        )}

        {/* Historial de pagos (desplegable opcional) */}
        {pagos.length > 0 && (
          <details className="public-payments-summary">
            <summary>Ver historial de pagos ({pagos.length})</summary>
            <div className="public-payments-list">
              {pagos.map((pago) => (
                <div key={pago.id} className="public-payment-item">
                  <span className="public-payment-type">
                    {pago.tipo === 'abono' ? 'Abono' : 'Pago final'}
                  </span>
                  <span className="public-payment-amount">
                    {formatMoney(pago.monto)}
                  </span>
                  <span className="public-payment-date">
                    {formatDate(pago.fecha_pago)}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Fecha de recepción */}
        {ticket.fecha_recepcion && (
          <p className="public-reception-date">
            Recepción: {formatDate(ticket.fecha_recepcion)}
          </p>
        )}

        {/* Código del ticket */}
        <p className="public-codigo">Ticket {ticket.codigo}</p>

        {/* Footer */}
        <div className="public-footer">
          <p className="public-muted">Si tienes dudas, contáctanos con este código</p>
        </div>
      </div>
    </div>
  );
}