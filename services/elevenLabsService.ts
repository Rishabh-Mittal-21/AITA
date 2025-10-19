const ELEVENLABS_API_KEY = "NOTHINGWHATSOEVER";

export const getElevenLabsAudio = async (text: string, voiceId: string): Promise<ArrayBuffer> => {
    
    const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': "NOTHINGWHATSOEVER",
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        // ElevenLabs API returns error details in `detail.message`
        throw new Error(`ElevenLabs API Error: ${errorData.detail?.message || errorData.message || response.statusText}`);
    }

    return response.arrayBuffer();
};
