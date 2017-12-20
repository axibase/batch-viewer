export interface InterpolationInterval {
    label: string;
    period: {
        count: number;
        unit: string;

    };
}

export const interpolationIntervals: InterpolationInterval[] = [
    {
        label: '5 seconds',
        period: {
            count: 5,
            unit: 'SECOND',
        },
    },
    {
        label: '10 seconds',
        period: {
            count: 10,
            unit: 'SECOND',
        },
    },
    {
        label: '15 seconds',
        period: {
            count: 15,
            unit: 'SECOND',
        },
    },
    {
        label: '20 seconds',
        period: {
            count: 20,
            unit: 'SECOND',
        },
    },
    {
        label: '30 seconds',
        period: {
            count: 30,
            unit: 'SECOND',
        },
    },
    {
        label: '1 minute',
        period: {
            count: 1,
            unit: 'MINUTE',
        },
    },
    {
        label: '2 minutes',
        period: {
            count: 2,
            unit: 'MINUTE',
        },
    },
    {
        label: '3 minutes',
        period: {
            count: 3,
            unit: 'MINUTE',
        },
    },
    {
        label: '5 minutes',
        period: {
            count: 5,
            unit: 'MINUTE',
        },
    },
    {
        label: '10 minutes',
        period: {
            count: 10,
            unit: 'MINUTE',
        },
    },
    {
        label: '15 minutes',
        period: {
            count: 15,
            unit: 'MINUTE',
        },
    },
    {
        label: '30 minutes',
        period: {
            count: 30,
            unit: 'MINUTE',
        },
    },
    {
        label: '1 hour',
        period: {
            count: 1,
            unit: 'HOUR',
        },
    },
    {
        label: '2 hours',
        period: {
            count: 2,
            unit: 'HOUR',
        },
    },
    {
        label: '3 hours',
        period: {
            count: 3,
            unit: 'HOUR',
        },
    },
    {
        label: '6 hours',
        period: {
            count: 6,
            unit: 'HOUR',
        },
    },
    {
        label: '8 hours',
        period: {
            count: 8,
            unit: 'HOUR',
        },
    },
    {
        label: '12 hours',
        period: {
            count: 12,
            unit: 'HOUR',
        },
    },
    {
        label: '1 day',
        period: {
            count: 1,
            unit: 'DAY',
        },
    },
];