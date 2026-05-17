

export function startAutomation(prisma) {

  setInterval(async () => {

    try {

      const now = new Date();

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const totalMinutes =
        currentHour * 60 + currentMinute;

      const entries =
        await prisma.timetableEntry.findMany({
          include: {
            room: true
          }
        });

      for (const entry of entries) {

        const [startH, startM] =
          entry.startTime
            .split(":")
            .map(Number);

        const [endH, endM] =
          entry.endTime
            .split(":")
            .map(Number);

        const startMinutes =
          startH * 60 + startM;

        const endMinutes =
          endH * 60 + endM;

        const autoOn =
          startMinutes - 15;

        const autoOff =
          endMinutes + 5;

        const roomIp =
          process.env.ROOM_101_IP;

        if (!roomIp) continue;

        // TURN ON

        if (
          totalMinutes >= autoOn &&
          totalMinutes <= endMinutes
        ) {

          await fetch(
            `${roomIp}/all/on`
          );

        }

        // TURN OFF

        if (
          totalMinutes >= autoOff
        ) {

          await fetch(
            `${roomIp}/all/off`
          );

        }

      }

    } catch (e) {
      console.error(
                "Automation Error:",
        e.message
      );
    }

  }, 60000);

}