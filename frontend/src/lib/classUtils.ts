// Utility functions for class synchronization

export async function uploadFilesToClass(classCode: string, files: File[], modes: string[] = ["notes", "flashcards"]) {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  formData.append('activeModes', JSON.stringify(modes));

  const response = await fetch(`/api/class/${classCode}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return await response.json();
}

export async function fetchClassContent(classCode: string) {
  const response = await fetch(`/api/class/${classCode}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch class');
  }

  return await response.json();
}

export async function createClass(teacherId: string, name: string, code: string, subject?: string, description?: string) {
  const response = await fetch('/api/teacher/class/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teacherId,
      name,
      code,
      subject,
      description,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create class');
  }

  return await response.json();
}

export async function getTeacherClasses(teacherId: string) {
  const response = await fetch(`/api/teacher/classes?teacherId=${teacherId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch classes');
  }

  return await response.json();
}

// Generate a random class code (e.g., SYN-4829)
export function generateClassCode(): string {
  const adjectives = ['SYN', 'FLUX', 'NEO', 'SYNC', 'ECHO', 'NOVA', 'APEX', 'SAGE'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${num}`;
}
