// src/components/BalanceHistorico.jsx 
import { useState, useEffect } from 'react'; import { Link, useNavigate } from 'react-router-dom'; import { supabase } from '../supabaseClient';

export default function BalanceHistorico() {
    const navigate = useNavigate(); const [balanceData, setBalanceData] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(null); const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        async function checkAdminAndFetchBalance() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    navigate('/login');
                    return;
                }

                const { data: userData, error: userError } = await supabase
                    .from('usuarios')
                    .select('rol')
                    .eq('auth_user_id', user.id)
                    .single();

                if (userError || !userData || userData.rol !== 'admin') {
                    setError('Acceso denegado. Solo administradores pueden ver el balance histórico.');
                    return;
                }

                setIsAdmin(true);

                const { data, error: rpcError } = await supabase.rpc('get_balance_historico_admin');

                if (rpcError) throw rpcError;
                setBalanceData(data || []);

            } catch (err) {
                console.error('Error:', err);
                setError(err.message || 'Error al cargar el balance histórico');
            } finally {
                setLoading(false);
            }
        }

        checkAdminAndFetchBalance();
    }, [navigate]);

    function formatMoney(amount) { if (amount === null || amount === undefined) return '$0.00'; return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', }).format(amount); }

    function formatDate(dateStr) { if (!dateStr) return '-'; const date = new Date(dateStr); return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', }); }

    const totalIngresos = balanceData.reduce((sum, m) => sum + Number(m.ingresos_totales || 0), 0); const totalCostos = balanceData.reduce((sum, m) => sum + Number(m.costos_refacciones || 0), 0); const totalGanancia = balanceData.reduce((sum, m) => sum + Number(m.ganancia_neta || 0), 0); const totalEntregas = balanceData.reduce((sum, m) => sum + Number(m.entregas_realizadas || 0), 0);

    if (loading) return (<div className="page"> <div className="card"><p>Cargando balance histórico...</p></div> </div>);

    if (error) return (<div className="page"> <div className="card"> <h1>Error</h1> <p style={{ color: '#dc2626' }}>{error}</p> <Link to="/dashboard" style={{ marginTop: '1rem', display: 'inline-block' }} className="btn btn-secondary"> ← Volver al Dashboard </Link> </div> </div>);

    return (<div className="page"> <div className="page-header"> <h1>Balance Histórico</h1> <Link to="/dashboard" className="btn btn-secondary">← Volver al Dashboard</Link> </div>

        {/* RESUMEN ACUMULADO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
                <p className="text-muted">Total Ingresos</p>
                <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>{formatMoney(totalIngresos)}</p>
            </div>
            <div className="card">
                <p className="text-muted">Total Costos</p>
                <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>{formatMoney(totalCostos)}</p>
            </div>
            <div className="card">
                <p className="text-muted">Ganancia Neta</p>
                <p className="text-2xl font-bold" style={{ color: '#6d4aff' }}>{formatMoney(totalGanancia)}</p>
            </div>
            <div className="card">
                <p className="text-muted">Entregas Realizadas</p>
                <p className="text-2xl font-bold">{totalEntregas}</p>
            </div>
        </div>

        {/* TABLA MENSUAL */}
        <div className="card">
            <h2 className="mb-4">Detalle Mensual</h2>

            {balanceData.length === 0 ? (
                <p className="text-muted">No hay registros de balances todavía.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Mes</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>Tickets</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>Ingresos</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>Costos</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>Ganancia Neta</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>Entregas</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>Promedio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {balanceData.map((mes, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{formatDate(mes.mes)}</td>
                                    <td style={{ textAlign: 'right', padding: '12px' }}>{mes.total_tickets}</td>
                                    <td style={{ textAlign: 'right', padding: '12px', color: '#16a34a' }}>{formatMoney(mes.ingresos_totales)}</td>
                                    <td style={{ textAlign: 'right', padding: '12px', color: '#dc2626' }}>{formatMoney(mes.costos_refacciones)}</td>
                                    <td style={{ textAlign: 'right', padding: '12px', fontWeight: '600' }}>{formatMoney(mes.ganancia_neta)}</td>
                                    <td style={{ textAlign: 'right', padding: '12px' }}>{mes.entregas_realizadas}</td>
                                    <td style={{ textAlign: 'right', padding: '12px' }}>{formatMoney(mes.ticket_promedio)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
    );
}