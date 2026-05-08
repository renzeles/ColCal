interface GCalEventBody {
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  attendeeEmails: string[];
  imageUrl?: string;
}

function buildBody({ title, description, location, startAt, endAt, attendeeEmails, imageUrl }: GCalEventBody) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let desc = description || "";
  if (imageUrl) {
    desc = desc ? `${desc}\n\n📷 Imagen: ${imageUrl}` : `📷 Imagen: ${imageUrl}`;
  }
  return {
    summary: title,
    description: desc,
    location: location || "",
    start: { dateTime: startAt.toISOString(), timeZone: timezone },
    end: { dateTime: endAt.toISOString(), timeZone: timezone },
    attendees: attendeeEmails.map((email) => ({ email })),
  };
}

async function parseError(res: Response) {
  const body = await res.json().catch(() => ({}));
  return body?.error?.message ?? res.statusText ?? `HTTP ${res.status}`;
}

export async function createGCalEvent(
  params: GCalEventBody & { googleToken: string }
): Promise<string> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.googleToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildBody(params)),
    }
  );
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.id as string;
}

export async function updateGCalEvent(
  params: GCalEventBody & { googleToken: string; eventId: string }
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(params.eventId)}?sendUpdates=all`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${params.googleToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildBody(params)),
    }
  );
  if (!res.ok) throw new Error(await parseError(res));
}

export async function deleteGCalEvent(
  googleToken: string,
  eventId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${googleToken}` },
    }
  );
  // 410 = already deleted, treat as success
  if (!res.ok && res.status !== 410) throw new Error(await parseError(res));
}
