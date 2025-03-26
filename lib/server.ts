import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error('API_URL environment variable is not defined');
}

export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function serverFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_data');

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: token.value }),
        ...init?.headers,
      },
      cache: 'no-store'
    });

    const data = await response.json();

    if (response.status === 401) {
      (await cookies()).delete('auth_data');
      redirect('/login');
    }

    if (!response.ok || data.status === 'fail') {
      throw new APIError(
        response.status,
        data.message || `Request failed with status ${response.status}`,
        data.error
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(500, 'Internal server error', 'INTERNAL_ERROR');
  }
}
