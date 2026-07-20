export async function sendEmailNotification(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Email notification sent:", data);
    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
}

export async function sendSmsNotification(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/send-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, body }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Failed to send SMS" };
    }
    console.log("SMS sent:", data);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}

