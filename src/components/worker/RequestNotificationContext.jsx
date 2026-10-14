import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Client } from "@stomp/stompjs";
import { useNavigate } from "react-router-dom";
import { NewRequestNotificationModal } from "./NewRequestNotificationModal";
import {
  getPendingOffer,
  registerDeviceToken,
  rejectRequest,
} from "../../api/offerApi";
import { requestPushToken } from "../../firebase/firebase";
import { parseApiError } from "../../api/apiError";
import { getAccessToken } from "../../api/authApi";

const RequestNotificationContext = createContext();

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws";
const STALE_CODES = [
  "OFFER_EXPIRED",
  "OFFER_ALREADY_CLOSED",
  "OFFER_NOT_FOUND",
  "REQUEST_NOT_AVAILABLE",
];

export const RequestNotificationProvider = ({ children }) => {
  const navigate = useNavigate();
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [profileVersion, setProfileVersion] = useState(0);

  const showNewOrder = useCallback((offer) => {
    setActionError(null);
    setIncomingOrder(offer);
  }, []);

  const closeModal = useCallback(() => {
    setIncomingOrder(null);
    setActionError(null);
  }, []);

  const refreshProfile = useCallback(() => {
    setProfileVersion((v) => v + 1);
  }, []);

  // WebSocket (STOMP): receive offers in real time
  useEffect(() => {
    if (!getAccessToken()) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      beforeConnect: () => {
        client.connectHeaders = { Authorization: `Bearer ${getAccessToken()}` };
      },
      onConnect: () => {
        client.subscribe("/user/queue/offers", (frame) => {
          const message = JSON.parse(frame.body);
          if (message.type === "NEW_OFFER") {
            showNewOrder(message.offer);
          } else if (message.type === "OFFER_CLOSED") {
            setIncomingOrder((current) =>
              current && current.offerId === message.offer.offerId
                ? null
                : current,
            );
          }
        });

        // Recover an offer missed while disconnected
        getPendingOffer()
          .then((offer) => {
            if (!offer) return;
            if (
              window.location.pathname === `/worker/request/${offer.requestId}`
            )
              return;
            showNewOrder(offer);
          })
          .catch(() => {});
      },
    });
    client.activate();

    return () => {
      client.deactivate();
    };
  }, [showNewOrder]);

  // Ask for notification permission and store the FCM token (called when the worker turns availability on)
  const enablePush = useCallback(async () => {
    try {
      const token = await requestPushToken();
      if (token) await registerDeviceToken(token);
    } catch (e) {
      console.warn("Could not enable push notifications", e);
    }
  }, []);

  // "Xem chi tiết": go to the request detail page
  const handleViewDetail = (order) => {
    closeModal();
    navigate(`/worker/request/${order.requestId}`);
  };

  // "Bỏ qua": reject the request
  const handleSkip = async (order) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await rejectRequest(order.requestId);
      closeModal();
    } catch (err) {
      const parsed = parseApiError(err);
      setActionError(
        parsed.message || "Không thể bỏ qua đơn, vui lòng thử lại.",
      );
      if (STALE_CODES.includes(parsed.code)) {
        setTimeout(closeModal, 1500);
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <RequestNotificationContext.Provider
      value={{ showNewOrder, enablePush, profileVersion, refreshProfile }}
    >
      {children}

      <NewRequestNotificationModal
        isOpen={Boolean(incomingOrder)}
        order={incomingOrder}
        onClose={closeModal}
        onViewDetail={handleViewDetail}
        onSkip={handleSkip}
        loading={actionLoading}
        error={actionError}
      />
    </RequestNotificationContext.Provider>
  );
};

export const useRequestNotification = () => useContext(RequestNotificationContext);
