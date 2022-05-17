/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */

import { DateTime } from "luxon";
import { Inject, Service } from "typedi";

import EmailService from "./email";
import {
	CareNotesDatabase,
	OfficeStaffDatabase,
	ShiftsDatabase,
	OfficeReport,
	OfficeStaffContactInfo,
	OfficeStaffRoles,
	AgencyConfigDatabase,
} from "../database";

import { EmailRecipient, Shift, TriggerProp } from "../types";
import SMSService from "./sms";
import { logger } from "@hca/logger";
import MESSAGES, { MESSAGE_TRIGGER_PROPS, MESSAGE_TYPES } from "../constants/messages";
import snakecase from "lodash.snakecase";

export interface OfficeReportMessageData {
	careNoteDocId: string;
}
