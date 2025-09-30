import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if(!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Obtener estadisticas reales
        const [
            totalUsers,
            activeUsers,
            totalProductos,
            lowStockProducts,
            totalOrders,
            completedOrders,
            totalInventoryValue,
            recentMovements
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.producto.count({ where: { isActive: true } }),
            prisma.producto.count({
                where: {
                    isActive: true,
                    stock: { lte: prisma.producto.fields.stockMinimo}
                }
            }),
            0, // TODO: Implementar cuando se tengan ordenes
            0, // TODO: Implementar cuando se tengan ordenes
            prisma.producto.aggregate({
                _sum: {
                    precioVenta:true
                }
            }).then(result => result._sum.precioVenta || 0),
            prisma.movimientoInventario.findMany({
                take: 10,
                orderBy: { fecha: 'desc' },
                include: {
                    producto: {
                        select: { nombre: true, codigo: true }
                    },
                    usuario: {
                        select: { name: true }
                    }
                }
            })
        ])

    //Obtener productos por categoría
    const productsByCategory = await prisma.producto.groupBy({
        by: ['tipo', 'categoria'],
        where: { isActive: true },
        _count: true
    })

    return NextResponse.json({
        totalUsers,
        activeUsers,
        totalProductos,
        lowStockProducts,
        totalOrders,
        completedOrders,
        totalInventoryValue,
        recentMovements,
        productsByCategory
    })

    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}