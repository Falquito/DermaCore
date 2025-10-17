// app/api/professional-stats/consultations-by-period/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppointmentStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || !currentUser.roles.includes('PROFESIONAL')) {
            return NextResponse.json(
                { error: 'No tienes permisos para acceder a esta información' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        const fromDate = dateFrom ? new Date(dateFrom) : new Date(new Date().setDate(new Date().getDate() - 30));
        const toDate = dateTo ? new Date(dateTo) : new Date();

        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);

        const appointments = await prisma.appointment.findMany({
            where: {
                profesionalId: currentUser.id,
                fecha: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            select: {
                fecha: true,
                estado: true,
            },
            orderBy: {
                fecha: 'asc',
            },
        });

        const dailyData: { [key: string]: { [key in AppointmentStatus]?: number } } = {};

        appointments.forEach(appointment => {
            const day = appointment.fecha.toISOString().split('T')[0];
            if (!dailyData[day]) {
                dailyData[day] = {};
            }
            dailyData[day][appointment.estado] = (dailyData[day][appointment.estado] || 0) + 1;
        });

        const labels = Object.keys(dailyData);
        const datasets = Object.values(AppointmentStatus).map(status => {
            return {
                label: status,
                data: labels.map(label => dailyData[label][status] || 0),
                fill: true,
            };
        });

        return NextResponse.json({ labels, datasets });

    } catch (error) {
        console.error('Error fetching consultations by period:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}