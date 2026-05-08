interface MSEventBody {
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  attendeeEmails: string[];
  imageUrl?: string;
}

function buildBody({ title, description, location, startAt, endAt, attendeeEmails, imageUrl }: MSEventBody) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let content = description || "";
  if (imageUrl) {
    content = content ? `${content}\n\n📷 Imagen: ${imageUrl}` : `📷 Imagen: ${imageUrl}`;
  }
  return {
    subject: title,
    body: { contentType: "Text", content },
    location: { displayName: location || "" },
    start: { dateTime: startAt.toISOString(), timeZone: timezone },
    end: { dateTime: endAt.toISOString(), timeZone: timezone },
    attendees: attendeeEmails.map((email) => ({
      emailAddress: { address: email },
      type: "required",
    })),
  };
}

async function parseError(res: Response) {
  const body = await res.json().catch(() => ({}));
  return body?.error?.message ?? res.statusText ?? `HTTP ${res.status}`;
}

export async function createMSEvent(
  params: MSEventBody & { msToken: string }
): Promise<string> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.msToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildBody(params)),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.id as string;
}

export async function updateMSEvent(
  params: MSEventBody & { msToken: string; eventId: string }
): Promise<void> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(params.eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${params.msToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildBody(params)),
    }
  );
  if (!res.ok) throw new Error(await parseError(res));
}

export async function deleteMSEvent(
  msToken: string,
  eventId: string
): Promise<void> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${msToken}` },
    }
  );
  if (!res.ok && res.status !== 404) throw new Error(await parseError(res));
}
