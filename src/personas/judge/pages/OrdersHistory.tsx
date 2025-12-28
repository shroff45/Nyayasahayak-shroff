// src/personas/judge/pages/OrdersHistory.tsx
// NyayaSahayak Hybrid v2.0.0 - Judge Orders History Page

import React, { useState } from 'react';
import {
    FileText,
    Calendar,
    Download,
    Eye,
    Filter,
    Search,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';

interface Order {
    id: string;
    cnr: string;
    caseTitle: string;
    orderType: 'Bail' | 'Judgment' | 'Interim' | 'Adjournment' | 'Notice';
    signedDate: string;
    status: 'Published' | 'Pending Review' | 'Archived';
    parties: string;
}

const MOCK_ORDERS: Order[] = [
    {
        id: 'ORD-2024-001',
        cnr: 'DLCT/2024/00123',
        caseTitle: 'State vs. Sharma',
        orderType: 'Bail',
        signedDate: '2024-12-20',
        status: 'Published',
        parties: 'State of Delhi vs. Ramesh Sharma'
    },
    {
        id: 'ORD-2024-002',
        cnr: 'DLCT/2024/00089',
        caseTitle: 'Kumar vs. Singh Industries',
        orderType: 'Interim',
        signedDate: '2024-12-18',
        status: 'Published',
        parties: 'Arun Kumar vs. Singh Industries Pvt Ltd'
    },
    {
        id: 'ORD-2024-003',
        cnr: 'DLCT/2024/00156',
        caseTitle: 'Patel Corruption Case',
        orderType: 'Adjournment',
        signedDate: '2024-12-15',
        status: 'Published',
        parties: 'CBI vs. Vijay Patel'
    },
    {
        id: 'ORD-2024-004',
        cnr: 'DLCT/2024/00201',
        caseTitle: 'Property Dispute - Gupta Family',
        orderType: 'Judgment',
        signedDate: '2024-12-10',
        status: 'Archived',
        parties: 'Gupta Brothers vs. Gupta Estate'
    },
    {
        id: 'ORD-2024-005',
        cnr: 'DLCT/2024/00178',
        caseTitle: 'Tax Evasion - ABC Corp',
        orderType: 'Notice',
        signedDate: '2024-12-22',
        status: 'Pending Review',
        parties: 'Income Tax Dept vs. ABC Corporation'
    }
];

const OrdersHistory: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filteredOrders = MOCK_ORDERS.filter(order => {
        const matchesSearch = order.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.cnr.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.parties.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || order.orderType === filterType;
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const getStatusColor = (status: Order['status']) => {
        switch (status) {
            case 'Published': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'Pending Review': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'Archived': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const getStatusIcon = (status: Order['status']) => {
        switch (status) {
            case 'Published': return <CheckCircle className="w-4 h-4" />;
            case 'Pending Review': return <Clock className="w-4 h-4" />;
            case 'Archived': return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type: Order['orderType']) => {
        switch (type) {
            case 'Bail': return 'bg-blue-500/20 text-blue-400';
            case 'Judgment': return 'bg-purple-500/20 text-purple-400';
            case 'Interim': return 'bg-cyan-500/20 text-cyan-400';
            case 'Adjournment': return 'bg-amber-500/20 text-amber-400';
            case 'Notice': return 'bg-pink-500/20 text-pink-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-7 h-7 text-purple-400" />
                        Orders History
                    </h1>
                    <p className="text-slate-400 mt-1">View and manage your signed orders and judgments</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Total: {MOCK_ORDERS.length} orders</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[250px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by case title, CNR, or parties..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Types</option>
                            <option value="Bail">Bail Orders</option>
                            <option value="Judgment">Judgments</option>
                            <option value="Interim">Interim Orders</option>
                            <option value="Adjournment">Adjournments</option>
                            <option value="Notice">Notices</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">All Status</option>
                        <option value="Published">Published</option>
                        <option value="Pending Review">Pending Review</option>
                        <option value="Archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No orders found matching your criteria</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-purple-500/30 transition-all"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(order.orderType)}`}>
                                            {order.orderType}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-1">{order.caseTitle}</h3>
                                    <p className="text-sm text-slate-400 mb-2">{order.parties}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span>Order ID: {order.id}</span>
                                        <span>CNR: {order.cnr}</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Signed: {new Date(order.signedDate).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors" title="View Order">
                                        <Eye className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Download PDF">
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Stats Footer */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{MOCK_ORDERS.filter(o => o.status === 'Published').length}</p>
                    <p className="text-xs text-slate-400">Published</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">{MOCK_ORDERS.filter(o => o.status === 'Pending Review').length}</p>
                    <p className="text-xs text-slate-400">Pending Review</p>
                </div>
                <div className="bg-gradient-to-br from-slate-500/10 to-gray-500/10 border border-slate-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-400">{MOCK_ORDERS.filter(o => o.status === 'Archived').length}</p>
                    <p className="text-xs text-slate-400">Archived</p>
                </div>
            </div>
        </div>
    );
};

export default OrdersHistory;
