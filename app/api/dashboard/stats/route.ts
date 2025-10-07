import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener estadísticas reales de la base de datos
    const [
      totalUsers,
      activeUsers,
      totalProducts,
      lowStockProducts,
      totalInventoryValue,
      recentMovements,
      productsByCategory
    ] = await Promise.all([
      // Total de usuarios
      prisma.user.count(),
      
      // Usuarios activos
      prisma.user.count({ where: { isActive: true } }),
      
      // Total de productos activos
      prisma.producto.count({ where: { isActive: true } }),
      
      // Productos con stock bajo
      prisma.producto.count({ 
        where: { 
          isActive: true,
          stock: { lte: prisma.producto.fields.stockMinimo }
        }
      }),
      
      // Valor total del inventario
      prisma.producto.aggregate({
        where: { isActive: true },
        _sum: { precioVenta: true }
      }).then(result => {
        const productos = prisma.producto.findMany({
          where: { isActive: true },
          select: { stock: true, precioVenta: true }
        }).then(prods => 
          prods.reduce((sum, p) => sum + (p.stock * p.precioVenta), 0)
        )
        return productos
      }),
      
      // Movimientos recientes
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
      }),
      
      // Productos por categoría
      prisma.producto.groupBy({
        by: ['tipo', 'categoria'],
        where: { isActive: true },
        _count: true,
        _sum: { stock: true }
      })
    ])

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalProducts,
      lowStockProducts,
      totalOrders: 0, // TODO: Implementar cuando tengamos órdenes
      completedOrders: 0, // TODO: Implementar cuando tengamos órdenes
      totalInventoryValue: await totalInventoryValue,
      recentMovements,
      productsByCategory
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}