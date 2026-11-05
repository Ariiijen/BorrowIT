-- Fill description, borrowing terms, and usage instructions for all equipment.
-- Refresh seeded equipment information while preserving lender-created custom text.

alter table public.equipment
  alter column description set default null;

alter table public.equipment
  alter column terms set default 'Borrow for the approved dates, return on time in the same condition, and report damage or loss immediately.';

alter table public.equipment
  alter column usage_instructions set default 'Inspect the equipment before use, follow the manufacturer or owner instructions, and return all accessories complete.';

update public.equipment
set description = case
      when lower(btrim(name)) like '%raspberry%' or lower(btrim(name)) like '%rpi%' then
        'Raspberry Pi 5 (8GB RAM), a high-performance single-board computer ideal for programming, server hosting, robotics, and IoT projects. Includes the official 27W USB-C power supply and an active cooling case. Perfect for students working on software development or hardware integration.'
      when lower(btrim(name)) like '%esp32%' then
        'ESP32 Arduino development board in good condition with built-in Wi-Fi and Bluetooth capabilities. Ideal for IoT projects, prototyping, and electronics classes. Available for short-term academic borrowing. Handle with care and return all necessary cables.'
      else case name
          when 'Dell Latitude Laptop' then
            'Campus checkout laptop with charger, suitable for classes, presentations, research, and software projects.'
          when 'Logitech Conference Camera' then
            'HD camera and microphone kit for online classes, meetings, and approved recorded presentations.'
          when 'Canon EOS Camera Kit' then
            'DSLR camera kit with standard lens and carrying case for approved photography projects.'
          when 'Portable Projector' then
            'Compact HDMI projector with power cable for classroom demonstrations, presentations, and campus events.'
          when 'Scientific Calculator' then
            'Calculator for engineering, mathematics, laboratory, and examination use.'
          when 'Portable PA Speaker' then
            'Rechargeable powered speaker with microphone for small presentations, rehearsals, and campus events.'
          when 'Microsoft Surface Pro' then
            'Touchscreen tablet laptop with stylus and keyboard for design work, fieldwork, and academic presentations.'
          when 'Campus Wi-Fi Hotspot' then
            'Portable internet hotspot for short-term academic fieldwork and approved remote connectivity.'
          when 'Laptop Dell XPS 13' then
            'Portable laptop intended for academic assignments, presentations, research, and software work.'
          when 'Projector Epson EB-970' then
            'Classroom projector for slides, videos, demonstrations, and approved campus presentations.'
          when 'Digital Oscilloscope' then
            'Laboratory oscilloscope for electronics measurements, experiments, and approved coursework.'
          else
            coalesce(
              nullif(btrim(description), ''),
              'Campus ' || lower(coalesce(category, 'equipment')) || ' item: ' || name || '.'
            )
        end
    end,
    terms = case
      when lower(btrim(name)) like '%raspberry%' or lower(btrim(name)) like '%rpi%' then
        'Maximum borrowing period is 14 days. Handle the board and pins with care; static electricity may damage components. A replacement fee will be charged if the board is lost or damaged due to misuse, incorrect power supply, or water damage. Please return all included accessories: case, power supply, and SD card.'
      when lower(btrim(name)) like '%esp32%' then
        'Maximum borrowing period is 7 days. The borrower is responsible for the item and must report any damage immediately. Late returns incur a penalty of 5 pesos per day. Please return the board and all necessary cables together.'
      else
        coalesce(
          nullif(btrim(terms), ''),
          'Maximum borrowing period is 14 days. The borrower is responsible for the equipment and must return it by the approved due date in the same condition. Report damage or loss immediately. Late returns may incur penalties, and replacement or repair fees may apply for misuse or damage.'
        )
    end,
    usage_instructions = case
      when lower(btrim(name)) like '%raspberry%' or lower(btrim(name)) like '%rpi%' then
        'Connect only the included 27W USB-C power supply and approved SD card. Do not power the board while inserting or removing components. Keep away from liquids, metal surfaces, and excessive heat. Use the active cooling case and shut down through the operating system before disconnecting power. Return the board, SD card, case, and power supply together.'
      when lower(btrim(name)) like '%esp32%' then
        'Power the board only through the included USB cable or an approved 5V supply. Never apply voltages above the supported GPIO limits, and do not short circuits on the breadboard. Disconnect power before changing wiring, keep away from liquids, and test circuits in a controlled setting. Return the board and all required cables.'
      else case category
          when 'Computing' then
            coalesce(nullif(btrim(usage_instructions), ''), 'Inspect the device and charger before use. Use on a stable surface and keep liquids away. Do not remove account profiles, install unauthorized software, disable security settings, or alter required configurations. Store it securely, shut down before return, and include the charger and any assigned accessories.')
          when 'Networking' then
            coalesce(nullif(btrim(usage_instructions), ''), 'Charge and inspect the device before use. Keep it in a secure location and use it only for approved academic activities. Do not share access credentials, reset user settings, open the device housing, or remove installed components. Return the hotspot with its charger and cable.')
          when 'Photography' then
            coalesce(nullif(btrim(usage_instructions), ''), 'Inspect the camera body, lens, battery, memory card, and carrying case before use. Attach the strap during handling, keep the lens covered when stored, and avoid moisture and extreme heat. Do not change physical parts without instruction. Return the kit clean and complete, including the battery, charger, cables, lens cap, and case.')
          when 'Audio Visual' then
            coalesce(nullif(btrim(usage_instructions), ''), 'Inspect the projector, HDMI cable, power cable, remote, and case before use. Place it on a stable surface, keep ventilation clear, and avoid blocking the lens or cooling openings. Use the correct display settings and allow it to cool before packing. Return all included accessories and cables.')
          when 'Audio' then
            coalesce(nullif(btrim(usage_instructions), ''), 'Inspect and fully charge the speaker before use. Set the volume to a safe level, keep the device dry, and avoid exceeding the recommended operating distance. Check the microphone, cables, and controls before events. Return the speaker charged with every assigned accessory.')
          when 'Learning Tools' then
            coalesce(nullif(btrim(usage_instructions), ''), 'Use the calculator only for the approved academic activity. Keep it dry and clean, avoid dropping it, and do not place writing or unauthorized modifications on its body. Remove batteries only when instructed, then return the calculator with its case and accessories.')
          else
            coalesce(
              nullif(btrim(usage_instructions), ''),
              'Inspect the equipment before use and verify that all components are present. Follow the manufacturer and owner instructions, use the required protective controls, avoid liquids or extreme temperatures, and keep all parts secure. Return the equipment clean with every cable, case, charger, and accessory.'
            )
        end
    end,
    updated_at = now();
