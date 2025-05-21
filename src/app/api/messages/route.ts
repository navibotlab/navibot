import { getWorkspaceFromContext } from '@/lib/utils/workspace';

export async function GET(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    // ... existing code ...
  } catch (error) {
    // ... existing code ...
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    // ... existing code ...
  } catch (error) {
    // ... existing code ...
  }
} 